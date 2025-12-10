import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogsService } from '../../modules/audit-logs/audit-logs.service';

@Injectable()
export class AuditLoggingInterceptor implements NestInterceptor {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const httpMethod = request.method;
    const url = request.url;
    
    
    // Skip if no user context, except for login and logout
    if (!user && !url.includes('/login') && !url.includes('/logout')) {
      return next.handle();
    }

    // Skip logging for admin logs endpoints, OPTIONS requests, and navigation-related GET requests
    if (request.url.includes('/admin/audit-logs') || 
        request.url.includes('/admin/error-logs') || 
        request.method === 'OPTIONS' ||
        this.shouldSkipLogging(httpMethod, url)) {
      return next.handle();
    }

    const handler = context.getHandler();
    const className = context.getClass().name;
    const methodName = handler.name;

    return next.handle().pipe(
      tap((response) => {
        
        // For login, extract user info from response
        if (url.includes('/login') && httpMethod === 'POST' && response?.user) {
          this.logLoginAction(response.user, request).catch(() => {});
        } else if (user) {
          this.logAction(user, httpMethod, url, className, methodName, request).catch(() => {});
        } else {
          console.log('⚠️ No user context for logging');
        }
      }),
    );
  }

  private shouldSkipLogging(httpMethod: string, url: string): boolean {
    // Only log: CREATE, UPDATE, DELETE, AUTH events, and SENSITIVE READS
    
    // Always log auth events (POST only for login/register/logout)
    if ((url.includes('/login') || url.includes('/register') || url.includes('/logout')) && httpMethod === 'POST') {
      return false;
    }
    if (url.includes('/change-password') || url.includes('/reset-password') || 
        url.includes('/forgot-password')) {
      return false;
    }
    
    // Log CREATE, UPDATE, DELETE operations
    if (httpMethod === 'POST' || httpMethod === 'PUT' || httpMethod === 'PATCH' || httpMethod === 'DELETE') {
      return false;
    }
    
    // Log only SENSITIVE READS (specific candidate details, exports, admin data)
    if (httpMethod === 'GET') {
      const sensitiveReads = [
        /\/candidates\/[^/]+$/,  // Individual candidate details
        /\/export/,              // Data exports
        /\/admin\//,             // Admin panel access
        /\/privacy\/export-data/, // GDPR data export
      ];
      
      return !sensitiveReads.some(pattern => pattern.test(url));
    }
    
    return true; // Skip everything else
  }

  private async logLoginAction(user: any, request: any): Promise<void> {
    const userName = user.fullName || user.email.split('@')[0];
    const userOrSystem = `${user.role}: ${userName}`;
    
    await this.auditLogsService.createLog({
      userOrSystem,
      action: 'USER_LOGIN',
      target: `User ID: #${user._id}`,
      details: 'User authenticated and session started',
    });
  }

  private async logAction(user: any, httpMethod: string, url: string, className: string, methodName: string, request: any): Promise<void> {
    let userOrSystem: string;
    
    if (user) {
      // Use fullName if available, otherwise extract name from email
      const userName = user.fullName && user.fullName.trim() !== '' 
        ? user.fullName 
        : user.email.split('@')[0];
      userOrSystem = `${user.role}: ${userName}`;
    } else {
      // For logout or other cases without user context
      userOrSystem = 'system: user';
    }
    
    const action = this.getActionName(httpMethod, url, className, methodName);
    const target = this.getTarget(url, request.params, user);
    const details = this.getDetails(httpMethod, url, request);

    await this.auditLogsService.createLog({
      userOrSystem,
      action,
      target,
      details,
    });
  }

  private getActionName(httpMethod: string, url: string, className: string, methodName: string): string {
    // Auth operations
    if (url.includes('/login') && httpMethod === 'POST') return 'USER_LOGIN';
    if (url.includes('/logout') && httpMethod === 'POST') return 'USER_LOGOUT';
    if (url.includes('/register') && httpMethod === 'POST') return 'USER_REGISTRATION';
    if (url.includes('/change-password')) return 'USER_PASSWORD_CHANGED';
    if (url.includes('/complete-profile')) return 'USER_PROFILE_UPDATED';
    if (url.includes('/forgot-password')) return 'PASSWORD_RESET_REQUESTED';
    if (url.includes('/reset-password')) return 'PASSWORD_RESET_COMPLETED';
    if (url.includes('/profile') && httpMethod === 'GET') return 'USER_PROFILE_ACCESSED';
    
    // Candidate operations
    if (url.includes('/upload-resume')) return 'CANDIDATE_RESUME_UPLOADED';
    if (url.includes('/linkedin')) return 'CANDIDATE_LINKEDIN_PROCESSED';
    if (url.includes('/candidates') && httpMethod === 'GET' && url.match(/\/candidates\/[^/]+$/)) return 'CANDIDATE_PROFILE_ACCESSED';
    if (url.includes('/candidates') && httpMethod === 'POST') return 'CANDIDATE_RECORD_CREATED';
    if (url.includes('/candidates') && httpMethod === 'PUT') return 'CANDIDATE_RECORD_UPDATED';
    if (url.includes('/candidates') && httpMethod === 'PATCH' && url.includes('/shortlist')) return 'CANDIDATE_SHORTLIST_TOGGLED';
    if (url.includes('/candidates') && httpMethod === 'DELETE') return 'CANDIDATE_RECORD_DELETED';
    
    // Export operations
    if (url.includes('/export/candidates')) return 'CANDIDATE_DATA_EXPORTED';
    if (url.includes('/export/report')) return 'CANDIDATE_REPORT_GENERATED';
    
    // Dashboard operations - only log specific API calls, not page loads
    if (url.includes('/dashboard/admin') && httpMethod === 'GET') return 'ADMIN_DASHBOARD_DATA_ACCESSED';
    if (url.includes('/dashboard/score-distribution') && httpMethod === 'GET') return 'CANDIDATE_SCORE_ANALYTICS_ACCESSED';
    
    // Privacy operations
    if (url.includes('/privacy/export-data')) return 'PERSONAL_DATA_EXPORTED';
    if (url.includes('/privacy/delete-data')) return 'PERSONAL_DATA_DELETED';
    if (url.includes('/privacy/policy')) return 'PRIVACY_POLICY_ACCESSED';
    if (url.includes('/privacy/retention-policy')) return 'DATA_RETENTION_POLICY_ACCESSED';
    
    // Admin operations
    if (url.includes('/admin/error-logs')) return 'SYSTEM_ERROR_LOGS_ACCESSED';
    if (url.includes('/admin/audit-logs')) return 'SYSTEM_AUDIT_LOGS_ACCESSED';
    
    return `${httpMethod}_${className.toUpperCase()}`;
  }

  private getTarget(url: string, params: any, user?: any): string {
    if (params?.id) {
      if (url.includes('/candidates')) return `Candidate ID: #${params.id}`;
      if (url.includes('/users')) return `User ID: #${params.id}`;
      if (url.includes('/export/report')) return `Report ID: #${params.id}`;
      return `Resource ID: #${params.id}`;
    }
    if (params?.token) {
      return `Reset Token: #${params.token.substring(0, 8)}...`;
    }
    
    // For user-specific operations, use the user ID
    if (user && (url.includes('/complete-profile') || url.includes('/profile') || 
                 url.includes('/change-password') || url.includes('/login') || 
                 url.includes('/register') || url.includes('/upload-resume') || 
                 url.includes('/linkedin') || url.includes('/export') || 
                 url.includes('/dashboard'))) {
      return `User ID: #${user.id}`;
    }
    
    if (url.includes('/candidates')) return 'Candidates System';
    if (url.includes('/users')) return 'User Management';
    if (url.includes('/privacy')) return 'Privacy & Data Protection';
    if (url.includes('/admin')) return 'Admin Panel';
    return 'System';
  }

  private getDetails(httpMethod: string, url: string, request: any): string {
    // Auth operations
    if (url.includes('/register')) return 'New user account created in system';
    if (url.includes('/login')) return 'User authenticated and session started';
    if (url.includes('/logout')) return 'User session terminated and logged out';
    if (url.includes('/change-password')) return 'User password updated successfully';
    if (url.includes('/complete-profile')) return 'User profile information updated with new data';
    if (url.includes('/forgot-password')) return 'Password reset request initiated';
    if (url.includes('/reset-password')) return 'Password successfully reset using secure token';
    if (url.includes('/profile') && httpMethod === 'GET') return 'User profile data retrieved';
    
    // Candidate operations
    if (url.includes('/upload-resume')) return 'Resume file uploaded and processed for evaluation';
    if (url.includes('/linkedin')) return 'LinkedIn profile data extracted and processed';
    if (url.includes('/candidates') && httpMethod === 'GET' && url.includes('/candidates/')) return 'Detailed candidate information accessed';
    if (url.includes('/candidates') && httpMethod === 'GET') return 'Candidates list accessed with filters';
    if (url.includes('/candidates') && httpMethod === 'POST') return 'New candidate record created';
    if (url.includes('/candidates') && httpMethod === 'PUT') return 'Candidate information updated';
    if (url.includes('/shortlist')) return 'Candidate shortlist status toggled';
    if (url.includes('/candidates') && httpMethod === 'DELETE') return 'Candidate record and PII data permanently deleted';
    
    // Export operations
    if (url.includes('/export/candidates')) {
      const format = request.query?.format || 'csv';
      return `Candidate data exported in ${format.toUpperCase()} format`;
    }
    if (url.includes('/export/report')) return 'Detailed candidate report generated';
    
    // Dashboard operations
    if (url.includes('/dashboard/admin')) return 'Admin dashboard with system metrics accessed';
    if (url.includes('/dashboard/score-distribution')) return 'Score distribution analytics accessed';
    if (url.includes('/dashboard')) return 'Dashboard analytics and metrics accessed';
    
    // Privacy operations
    if (url.includes('/privacy/export-data')) return 'User data exported for GDPR compliance';
    if (url.includes('/privacy/delete-data')) return 'User data permanently deleted (Right to be forgotten)';
    if (url.includes('/privacy/policy')) return 'Privacy policy document accessed';
    if (url.includes('/privacy/retention-policy')) return 'Data retention policy accessed';
    
    // Admin operations
    if (url.includes('/admin/error-logs')) return 'System error logs accessed';
    if (url.includes('/admin/audit-logs')) return 'System audit logs accessed';
    
    return `${httpMethod} operation performed on ${url}`;
  }
}
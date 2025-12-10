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
    
    if (!user) {
      return next.handle();
    }

    const handler = context.getHandler();
    const className = context.getClass().name;
    const methodName = handler.name;
    const httpMethod = request.method;
    const url = request.url;

    return next.handle().pipe(
      tap(() => {
        this.logAction(user, httpMethod, url, className, methodName, request).catch(() => {});
      }),
    );
  }

  private async logAction(user: any, httpMethod: string, url: string, className: string, methodName: string, request: any): Promise<void> {
    const userOrSystem = `${user.role}: ${user.fullName || user.email}`;
    const action = this.getActionName(httpMethod, url, className, methodName);
    const target = this.getTarget(url, request.params);
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
    if (url.includes('/login')) return 'USER_LOGIN';
    if (url.includes('/logout')) return 'USER_LOGOUT';
    if (url.includes('/register')) return 'USER_REGISTRATION';
    if (url.includes('/change-password')) return 'PASSWORD_CHANGED';
    if (url.includes('/complete-profile')) return 'PROFILE_COMPLETED';
    if (url.includes('/forgot-password')) return 'PASSWORD_RESET_REQUESTED';
    if (url.includes('/reset-password')) return 'PASSWORD_RESET';
    if (url.includes('/profile') && httpMethod === 'GET') return 'PROFILE_ACCESSED';
    
    // Candidate operations
    if (url.includes('/upload-resume')) return 'RESUME_UPLOAD';
    if (url.includes('/linkedin')) return 'LINKEDIN_PROFILE_PROCESSED';
    if (url.includes('/candidates') && httpMethod === 'GET' && url.includes('/candidates/')) return 'CANDIDATE_DETAILS_ACCESSED';
    if (url.includes('/candidates') && httpMethod === 'GET') return 'CANDIDATES_LIST_ACCESSED';
    if (url.includes('/candidates') && httpMethod === 'POST') return 'CANDIDATE_CREATED';
    if (url.includes('/candidates') && httpMethod === 'PUT') return 'CANDIDATE_UPDATED';
    if (url.includes('/candidates') && httpMethod === 'PATCH' && url.includes('/shortlist')) return 'CANDIDATE_SHORTLIST_TOGGLED';
    if (url.includes('/candidates') && httpMethod === 'DELETE') return 'CANDIDATE_DELETED';
    
    // Export operations
    if (url.includes('/export/candidates')) return 'CANDIDATES_DATA_EXPORTED';
    if (url.includes('/export/report')) return 'CANDIDATE_REPORT_GENERATED';
    
    // Dashboard operations
    if (url.includes('/dashboard/admin')) return 'ADMIN_DASHBOARD_ACCESSED';
    if (url.includes('/dashboard/score-distribution')) return 'SCORE_DISTRIBUTION_ACCESSED';
    if (url.includes('/dashboard')) return 'DASHBOARD_ACCESSED';
    
    // Privacy operations
    if (url.includes('/privacy/export-data')) return 'USER_DATA_EXPORTED';
    if (url.includes('/privacy/delete-data')) return 'USER_DATA_DELETED';
    if (url.includes('/privacy/policy')) return 'PRIVACY_POLICY_ACCESSED';
    if (url.includes('/privacy/retention-policy')) return 'RETENTION_POLICY_ACCESSED';
    
    // Admin operations
    if (url.includes('/admin/error-logs')) return 'ERROR_LOGS_ACCESSED';
    if (url.includes('/admin/audit-logs')) return 'AUDIT_LOGS_ACCESSED';
    
    return `${httpMethod}_${className.toUpperCase()}`;
  }

  private getTarget(url: string, params: any): string {
    if (params?.id) {
      if (url.includes('/candidates')) return `Candidate ID: #${params.id}`;
      if (url.includes('/users')) return `User ID: #${params.id}`;
      if (url.includes('/export/report')) return `Report ID: #${params.id}`;
      return `Resource ID: #${params.id}`;
    }
    if (params?.token) {
      return 'Password Reset Token';
    }
    if (url.includes('/candidates')) return 'Candidates System';
    if (url.includes('/users')) return 'User Management';
    if (url.includes('/dashboard')) return 'Analytics Dashboard';
    if (url.includes('/export')) return 'Data Export System';
    if (url.includes('/auth')) return 'Authentication System';
    if (url.includes('/privacy')) return 'Privacy & Data Protection';
    if (url.includes('/admin')) return 'Admin Panel';
    return 'System';
  }

  private getDetails(httpMethod: string, url: string, request: any): string {
    // Auth operations
    if (url.includes('/register')) return 'New user account registered';
    if (url.includes('/login')) return 'User successfully authenticated';
    if (url.includes('/logout')) return 'User session terminated';
    if (url.includes('/change-password')) return 'User password changed successfully';
    if (url.includes('/complete-profile')) return 'User profile completed with additional information';
    if (url.includes('/forgot-password')) return 'Password reset email sent';
    if (url.includes('/reset-password')) return 'Password reset using token';
    if (url.includes('/profile') && httpMethod === 'GET') return 'User profile information accessed';
    
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
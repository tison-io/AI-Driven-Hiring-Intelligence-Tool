import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorLogsService } from '../../modules/error-logs/error-logs.service';

@Injectable()
export class ErrorLoggingInterceptor implements NestInterceptor {
  constructor(private readonly errorLogsService: ErrorLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    return next.handle().pipe(
      catchError((error) => {
        this.logError(error, context, user).catch(() => {});
        return throwError(() => error);
      }),
    );
  }

  private async logError(error: any, context: ExecutionContext, user?: any): Promise<void> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const className = context.getClass().name;
    const methodName = handler.name;
    
    let severity: 'info' | 'warning' | 'error' | 'critical' = 'error';
    
    if (error instanceof HttpException) {
      const status = error.getStatus();
      severity = status >= 500 ? 'critical' : status >= 400 ? 'warning' : 'error';
    }
    
    await this.errorLogsService.createLog({
      userOrSystem: user?.id ? `user:${user.id}` : 'system',
      action: `${className}.${methodName}`,
      target: `${request.method} ${request.url}`,
      details: error.message || 'Unknown error',
      severity,
    });
  }
}
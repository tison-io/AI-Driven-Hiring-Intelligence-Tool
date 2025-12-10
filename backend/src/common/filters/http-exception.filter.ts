import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ErrorLogsService } from '../../modules/error-logs/error-logs.service';

@Catch(HttpException)
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly errorLogsService: ErrorLogsService) {}
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // Log the HTTP exception
    this.errorLogsService.createLog({
      userOrSystem: request.user?.['id'] || 'system',
      action: 'http_exception',
      target: `${request.method} ${request.url}`,
      details: `${exception.message} (Status: ${status})`,
      severity: status >= 500 ? 'critical' : status >= 400 ? 'error' : 'warning',
    }).catch(() => {}); // Silent fail to prevent logging errors from breaking the response

    const errorResponse = {
      error: true,
      message: exception.message,
      status: status,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(errorResponse);
  }
}
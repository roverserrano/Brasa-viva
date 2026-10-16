import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger
} from '@nestjs/common';
import type { RequestContext } from './request-context';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ApiErrors');

  catch(exception: unknown, host: ArgumentsHost): void {
    const request = host.switchToHttp().getRequest<RequestContext>();
    const response = host
      .switchToHttp()
      .getResponse<{ status(code: number): { json(body: unknown): void } }>();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const payload = exception instanceof HttpException ? exception.getResponse() : null;
    const fields =
      payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
    const messages = Array.isArray(fields.message)
      ? fields.message.filter((value): value is string => typeof value === 'string')
      : [];
    const message =
      status >= 500
        ? 'No pudimos completar la operación. Intenta nuevamente en unos momentos.'
        : typeof fields.message === 'string'
          ? fields.message
          : messages.join(' ') || 'Revisa los datos e intenta nuevamente.';
    if (status >= 500) {
      this.logger.error(
        JSON.stringify({
          requestId: request.requestId,
          method: request.method,
          path: (request.originalUrl ?? request.url ?? '').split('?')[0],
          status,
          errorType: exception instanceof Error ? exception.name : 'UnknownError'
        })
      );
    }
    response.status(status).json({
      code:
        status >= 500
          ? 'SERVICE_UNAVAILABLE'
          : typeof fields.code === 'string'
            ? fields.code
            : `HTTP_${status}`,
      message,
      ...(status < 500 && fields.details ? { details: fields.details } : {}),
      requestId: request.requestId
    });
  }
}

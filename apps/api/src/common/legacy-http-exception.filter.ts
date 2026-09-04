import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';

/** Keeps the JSON error shape used by the existing frontend while routes move to Nest. */
@Catch(HttpException)
export class LegacyHttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host
      .switchToHttp()
      .getResponse<{ status: (code: number) => { send: (body: unknown) => void } }>();
    const status = exception.getStatus();
    const payload = exception.getResponse();
    const message =
      typeof payload === 'string'
        ? payload
        : ((payload as { message?: string | string[] }).message ?? exception.message);
    response.status(status).send({ error: Array.isArray(message) ? message.join(', ') : message });
  }
}

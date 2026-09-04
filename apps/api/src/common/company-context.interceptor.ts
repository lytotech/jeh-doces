import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { runForCompany } from '../infrastructure/database/client';
import { AuthenticatedRequest } from './auth.types';

@Injectable()
export class CompanyContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.auth) return next.handle();
    return runForCompany(request.auth.companyId, () => next.handle());
  }
}

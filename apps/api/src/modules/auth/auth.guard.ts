import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from '../../common/auth.types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<FastifyRequest & AuthenticatedRequest>();
    const reply = context.switchToHttp().getResponse<FastifyReply>();
    request.auth = await this.authService.context(request, reply);
    if (request.auth.companyInactive && !request.url.startsWith('/api/auth/') && !request.url.startsWith('/api/account/')) {
      throw new ForbiddenException('Esta empresa está inativa. Recupere-a ou crie uma nova empresa para continuar.');
    }
    return true;
  }
}

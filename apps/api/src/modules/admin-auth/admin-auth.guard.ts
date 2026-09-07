import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AdminAuthService } from './admin-auth.service';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(@Inject(AdminAuthService) private readonly service: AdminAuthService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<FastifyRequest & { adminAuth?: any }>();
    const reply = context.switchToHttp().getResponse<FastifyReply>();
    request.adminAuth = await this.service.context(request, reply);
    return true;
  }
}

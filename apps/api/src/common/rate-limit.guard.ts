import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { RateLimitService } from './rate-limit.service';
import { env } from '../config/env';

const sensitiveRoutes = new Set([
  '/api/auth/login',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/resend-verification',
  '/api/auth/verify-email',
]);

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly limiter = new RateLimitService();

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const reply = context.switchToHttp().getResponse<FastifyReply>();
    const path = request.url.split('?')[0];

    if (!path.startsWith('/api') || path === '/api/health') return true;

    const ip = request.ip || 'unknown';
    const body = request.body as { email?: unknown } | undefined;
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const isInvite = request.method === 'POST' && path === '/api/auth/invitations';
    const isSensitive = request.method === 'POST' && sensitiveRoutes.has(path);
    const policy = isInvite
      ? {
          limit: env.rateLimit.invitePerHour,
          windowSeconds: 3600,
          key: `${ip}:invite:${email || 'unknown'}`,
        }
      : isSensitive
        ? {
            limit: env.rateLimit.authPerWindow,
            windowSeconds: 900,
            key: `${ip}:auth:${path}:${email || 'unknown'}`,
          }
        : { limit: env.rateLimit.apiPerMinute, windowSeconds: 60, key: `${ip}:api` };

    const result = this.limiter.consume(policy.key, policy.limit, policy.windowSeconds);
    reply.header('X-RateLimit-Limit', policy.limit);
    reply.header('X-RateLimit-Remaining', result.remaining);
    reply.header('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + result.retryAfter);

    if (!result.allowed) {
      reply.header('Retry-After', result.retryAfter);
      throw new HttpException(
        'Muitas solicitações. Tente novamente mais tarde.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}

import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
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
  private readonly logger = new Logger(RateLimitGuard.name);

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const reply = context.switchToHttp().getResponse<FastifyReply>();
    const path = request.url.split('?')[0];

    if (!path.startsWith('/api') || path === '/api/health') return true;

    const ip = request.ip || 'unknown';
    const body = request.body as { email?: unknown } | undefined;
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const phone =
      typeof (body as { customer?: { phone?: unknown } } | undefined)?.customer?.phone === 'string'
        ? String((body as { customer: { phone: string } }).customer.phone).replace(/\D/g, '')
        : '';
    const isInvite = request.method === 'POST' && path === '/api/auth/invitations';
    const isSensitive = request.method === 'POST' && sensitiveRoutes.has(path);
    const isPublicCatalogOrder =
      request.method === 'POST' && /^\/api\/public\/catalog\/[^/]+\/orders$/.test(path);
    const policies = isPublicCatalogOrder
      ? [
          {
            limit: env.rateLimit.publicCatalogPerWindow,
            windowSeconds: 900,
            key: `public-catalog:ip:${ip}`,
          },
          ...(phone
            ? [
                {
                  limit: env.rateLimit.publicCatalogPhonePerWindow,
                  windowSeconds: 900,
                  key: `public-catalog:phone:${phone}`,
                },
              ]
            : []),
        ]
      : [
          isInvite
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
              : { limit: env.rateLimit.apiPerMinute, windowSeconds: 60, key: `${ip}:api` },
        ];

    const results = policies.map((policy) => ({
      policy,
      result: this.limiter.consume(policy.key, policy.limit, policy.windowSeconds),
    }));
    const blocked = results.find(({ result }) => !result.allowed);
    const primary = results[0];
    reply.header('X-RateLimit-Limit', primary.policy.limit);
    reply.header('X-RateLimit-Remaining', primary.result.remaining);
    reply.header('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + primary.result.retryAfter);

    if (blocked) {
      reply.header('Retry-After', blocked.result.retryAfter);
      if (isPublicCatalogOrder) {
        this.logger.warn(
          JSON.stringify({
            event: 'public_form_blocked',
            reason: 'rate_limit',
            requestId: (request as FastifyRequest & { requestId?: string }).requestId,
          }),
        );
      }
      throw new HttpException(
        'Muitas solicitações. Tente novamente mais tarde.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}

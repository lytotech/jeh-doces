import 'reflect-metadata';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import { AppModule } from './nest/app.module';
import { env } from './config/env';
import { LegacyHttpExceptionFilter } from './common/legacy-http-exception.filter';
import { RateLimitGuard } from './common/rate-limit.guard';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../../web/dist');

export async function createApplication() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ bodyLimit: 10 * 1024 * 1024, trustProxy: env.trustProxy }),
    { logger: process.env.NODE_ENV === 'test' ? false : undefined },
  );
  app.useGlobalFilters(new LegacyHttpExceptionFilter());
  app.useGlobalGuards(new RateLimitGuard());
  app.enableCors({ origin: env.corsOrigins.length ? env.corsOrigins : true, credentials: true });
  const fastify = app.getHttpAdapter().getInstance();
  fastify.addHook('onSend', async (request: { url: string }, reply: any) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'SAMEORIGIN');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (request.url.startsWith('/api/')) reply.header('Cache-Control', 'no-store');
  });
  await fastify.register(fastifyCookie as any);
  await fastify.register(fastifyStatic as any, { root: distPath, wildcard: false });
  await app.init();
  return app;
}

export async function bootstrap() {
  const app = await createApplication();
  await app.listen({ port: env.port, host: env.host });
  console.log(`\n🧁 CONFEITI • API NestJS + Fastify rodando na porta ${env.port}`);
  console.log(`🏠 Local: http://localhost:${env.port}`);
  return app;
}

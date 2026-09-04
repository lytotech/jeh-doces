import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createApplication } from './main';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { RateLimitService } from './common/rate-limit.service';

let app: NestFastifyApplication;

before(async () => {
  process.env.NODE_ENV = 'test';
  app = await createApplication();
});

after(async () => {
  await app.close();
});

test('recusa acesso sem sessão em endpoint protegido', async () => {
  const response = await app.inject({ method: 'GET', url: '/api/auth/me' });
  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.json(), { error: 'Não autenticado.' });
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
  assert.equal(response.headers['x-frame-options'], 'SAMEORIGIN');
  assert.equal(response.headers['cache-control'], 'no-store');
});

test('retorna 404 JSON para endpoint inexistente da API', async () => {
  const response = await app.inject({ method: 'GET', url: '/api/endpoint-inexistente' });
  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.json(), { error: 'Cannot GET /api/endpoint-inexistente' });
});

test('bloqueia excesso de solicitações no bucket', () => {
  const limiter = new RateLimitService();
  assert.equal(limiter.consume('test', 2, 60).allowed, true);
  assert.equal(limiter.consume('test', 2, 60).allowed, true);
  assert.equal(limiter.consume('test', 2, 60).allowed, false);
});

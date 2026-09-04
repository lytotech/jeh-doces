import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createApplication } from './main';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

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
});

test('retorna 404 JSON para endpoint inexistente da API', async () => {
  const response = await app.inject({ method: 'GET', url: '/api/endpoint-inexistente' });
  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.json(), { error: 'Cannot GET /api/endpoint-inexistente' });
});

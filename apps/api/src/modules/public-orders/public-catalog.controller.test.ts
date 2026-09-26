import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { env } from '../../config/env';
import { verifyTurnstile } from './public-catalog.controller';

const originalFetch = globalThis.fetch;
const originalSecret = env.turnstileSecretKey;

afterEach(() => {
  globalThis.fetch = originalFetch;
  env.turnstileSecretKey = originalSecret;
});

test('aceita token Turnstile validado pelo provedor', async () => {
  env.turnstileSecretKey = 'test-secret';
  globalThis.fetch = async (_input, init) => {
    assert.equal(init?.method, 'POST');
    assert.match(String(init?.body), /secret=test-secret/);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  };
  assert.equal(await verifyTurnstile('valid-token', '127.0.0.1'), true);
});

test('recusa token Turnstile inválido', async () => {
  env.turnstileSecretKey = 'test-secret';
  globalThis.fetch = async () => new Response(JSON.stringify({ success: false }), { status: 200 });
  assert.equal(await verifyTurnstile('invalid-token'), false);
});

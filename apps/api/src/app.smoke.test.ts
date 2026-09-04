import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { AddressInfo } from 'node:net';
import { app } from './app';

let server: ReturnType<typeof app.listen>;
let baseUrl = '';

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve, reject) => {
    server.once('listening', () => {
      const address = server.address() as AddressInfo;
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
    server.once('error', reject);
  });
});

after(async () => {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

test('recusa acesso sem sessão em endpoint protegido', async () => {
  const response = await fetch(`${baseUrl}/api/auth/me`);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Não autenticado.' });
});

test('mantém a resposta de endpoint inexistente da API', async () => {
  const response = await fetch(`${baseUrl}/api/endpoint-inexistente`);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Não autenticado.' });
});

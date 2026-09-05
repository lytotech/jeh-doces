const expectedVersion = process.argv[2];
const baseUrl = (process.argv[3] || 'https://confeiti.com.br').replace(/\/$/, '');

if (!expectedVersion) {
  console.error('Uso: node scripts/check-production.mjs <versão> [url]');
  process.exit(2);
}

const htmlResponse = await globalThis.fetch(`${baseUrl}/`, { cache: 'no-store' });
if (!htmlResponse.ok) throw new Error(`Frontend retornou HTTP ${htmlResponse.status}.`);
const html = await htmlResponse.text();
const asset = html.match(/src="([^"]+\.js)"/)?.[1];
if (!asset) throw new Error('Bundle JavaScript não encontrado no HTML publicado.');

const bundleResponse = await globalThis.fetch(new globalThis.URL(asset, `${baseUrl}/`), {
  cache: 'no-store',
});
if (!bundleResponse.ok) throw new Error(`Bundle retornou HTTP ${bundleResponse.status}.`);
const bundle = await bundleResponse.text();
if (!bundle.includes(expectedVersion)) {
  throw new Error(`Versão esperada ${expectedVersion} não encontrada no bundle ${asset}.`);
}

const requestId = `production-check-${Date.now()}`;
const healthResponse = await globalThis.fetch(`${baseUrl}/api/health`, {
  headers: { 'x-request-id': requestId },
  cache: 'no-store',
});
const health = await healthResponse.json();
if (!healthResponse.ok || health.status !== 'ok' || health.database !== 'ok') {
  throw new Error(`Healthcheck inválido: HTTP ${healthResponse.status} ${JSON.stringify(health)}`);
}
const responseRequestId = healthResponse.headers.get('x-request-id');
if (responseRequestId !== requestId) {
  throw new Error(
    `x-request-id não foi preservado: esperado ${requestId}, recebido ${responseRequestId}.`,
  );
}

console.log(JSON.stringify({ baseUrl, version: expectedVersion, asset, health, requestId }));

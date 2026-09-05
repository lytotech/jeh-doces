import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { isMercadoPagoSignatureValid } from './billing.service';

test('valida assinatura oficial do webhook do Mercado Pago', () => {
  const nowMs = Date.parse('2026-09-04T20:00:00.000Z');
  const ts = Math.floor(nowMs / 1000);
  const manifest = 'id:177339162912;request-id:req-123;ts:' + ts + ';';
  const signature = createHmac('sha256', 'secret-test').update(manifest).digest('hex');
  assert.equal(isMercadoPagoSignatureValid({
    signature: `ts=${ts},v1=${signature}`,
    requestId: 'req-123',
    dataId: '177339162912',
    nowMs,
    secret: 'secret-test',
  }), true);
});

test('recusa assinatura ausente, adulterada ou expirada', () => {
  const nowMs = Date.parse('2026-09-04T20:00:00.000Z');
  assert.equal(isMercadoPagoSignatureValid({ signature: undefined, requestId: 'req', dataId: '1', nowMs, secret: 'secret' }), false);
  assert.equal(isMercadoPagoSignatureValid({ signature: `ts=${Math.floor(nowMs / 1000) - 3601},v1=bad`, requestId: 'req', dataId: '1', nowMs, secret: 'secret' }), false);
});

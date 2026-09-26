import assert from 'node:assert/strict';
import test from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { companyStatusData } from './admin-auth.service';

test('valida dados de bloqueio e reativação de empresas', () => {
  assert.deepEqual(companyStatusData({ active: false, reason: 'Solicitação do suporte' }), {
    active: false,
    reason: 'Solicitação do suporte',
  });
  assert.deepEqual(companyStatusData({ active: true, reason: 'Pagamento regularizado' }), {
    active: true,
    reason: 'Pagamento regularizado',
  });
});

test('recusa alteração de empresa sem status ou motivo válido', () => {
  assert.throws(() => companyStatusData({ reason: 'Motivo' }), BadRequestException);
  assert.throws(() => companyStatusData({ active: false, reason: 'ok' }), BadRequestException);
  assert.throws(
    () => companyStatusData({ active: false, reason: 'x'.repeat(501) }),
    BadRequestException,
  );
});

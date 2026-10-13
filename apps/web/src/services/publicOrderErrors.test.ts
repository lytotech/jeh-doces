import assert from 'node:assert/strict';
import test from 'node:test';
import { getPublicOrderErrorMessage } from './publicOrderErrors';

test('orienta o visitante quando o limite público é atingido', () => {
  assert.equal(
    getPublicOrderErrorMessage(new Error('API Error 429: muitas solicitações')),
    'Muitas tentativas de envio. Aguarde alguns minutos e tente novamente.',
  );
});

test('orienta o visitante a refazer a validação de segurança', () => {
  assert.equal(
    getPublicOrderErrorMessage(new Error('API Error 400: Não foi possível validar o envio.')),
    'A validação de segurança expirou. Aguarde a nova validação e tente novamente.',
  );
});

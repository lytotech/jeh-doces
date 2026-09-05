import test from 'node:test';
import assert from 'node:assert/strict';
import { isPaymentAmountValid } from './billing.service';

test('aceita somente o valor e a moeda esperados para o plano', () => {
  assert.equal(isPaymentAmountValid({ transaction_amount: 19.8, currency_id: 'BRL' }, 'monthly'), true);
  assert.equal(isPaymentAmountValid({ transaction_amount: 179.8, currency_id: 'BRL' }, 'annual'), true);
  assert.equal(isPaymentAmountValid({ transaction_amount: 19.8, currency_id: 'USD' }, 'monthly'), false);
  assert.equal(isPaymentAmountValid({ transaction_amount: 20, currency_id: 'BRL' }, 'monthly'), false);
});

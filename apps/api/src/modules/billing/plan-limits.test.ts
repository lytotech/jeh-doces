import test from 'node:test';
import assert from 'node:assert/strict';
import { BASIC_LIMITS, canCreateWithinLimit } from './plan-limits';

test('plano Básico permite criar até o limite configurado', () => {
  assert.equal(canCreateWithinLimit(0, BASIC_LIMITS.products), true);
  assert.equal(canCreateWithinLimit(BASIC_LIMITS.products - 1, BASIC_LIMITS.products), true);
  assert.equal(canCreateWithinLimit(BASIC_LIMITS.products, BASIC_LIMITS.products), false);
});

test('limites básicos são explícitos por recurso', () => {
  assert.deepEqual(BASIC_LIMITS, { products: 10, materials: 20, ingredients: 30, ordersPerMonth: 20 });
});

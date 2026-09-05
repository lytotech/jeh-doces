import test from 'node:test';
import assert from 'node:assert/strict';
import { SubscriptionPlan } from '@prisma/client';
import { BASIC_LIMITS, canCreateWithinLimit, hasCurrentPaidPeriod } from './plan-limits';

test('plano Básico permite criar até o limite configurado', () => {
  assert.equal(canCreateWithinLimit(0, BASIC_LIMITS.products), true);
  assert.equal(canCreateWithinLimit(BASIC_LIMITS.products - 1, BASIC_LIMITS.products), true);
  assert.equal(canCreateWithinLimit(BASIC_LIMITS.products, BASIC_LIMITS.products), false);
});

test('limites básicos são explícitos por recurso', () => {
  assert.deepEqual(BASIC_LIMITS, {
    products: 10,
    materials: 20,
    ingredients: 30,
    ordersPerMonth: 20,
  });
});

test('período pago continua válido durante sincronização ou cancelamento da renovação', () => {
  const now = new Date('2026-09-05T15:00:00.000Z');
  const base = {
    plan: SubscriptionPlan.monthly,
    currentPeriodEnd: new Date('2026-10-05T15:00:00.000Z'),
  };
  assert.equal(hasCurrentPaidPeriod({ ...base, status: 'active' }, now), true);
  assert.equal(hasCurrentPaidPeriod({ ...base, status: 'pending' }, now), true);
  assert.equal(hasCurrentPaidPeriod({ ...base, status: 'canceled' }, now), true);
  assert.equal(hasCurrentPaidPeriod({ ...base, status: 'past_due' }, now), false);
  assert.equal(
    hasCurrentPaidPeriod(
      { plan: SubscriptionPlan.basic, status: 'active', currentPeriodEnd: base.currentPeriodEnd },
      now,
    ),
    false,
  );
  assert.equal(
    hasCurrentPaidPeriod({ ...base, status: 'active', currentPeriodEnd: now }, now),
    false,
  );
});

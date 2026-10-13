import assert from 'node:assert/strict';
import test from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { buildFinancialDashboard, companyStatusData } from './admin-auth.service';

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

test('agrega receita recebida, planos e vencimentos do dashboard financeiro', () => {
  const now = new Date('2026-10-13T12:00:00.000Z');
  const result = buildFinancialDashboard(
    [
      {
        amount: 19.8,
        plan: SubscriptionPlan.monthly,
        status: 'approved',
        paidAt: new Date('2026-10-05T12:00:00.000Z'),
        refundedAt: null,
      },
      {
        amount: 179.8,
        plan: SubscriptionPlan.annual,
        status: 'approved',
        paidAt: new Date('2026-09-05T12:00:00.000Z'),
        refundedAt: null,
      },
      {
        amount: 19.8,
        plan: SubscriptionPlan.monthly,
        status: 'approved',
        paidAt: new Date('2026-08-05T12:00:00.000Z'),
        refundedAt: new Date('2026-08-06T12:00:00.000Z'),
      },
    ],
    [
      {
        plan: SubscriptionPlan.monthly,
        status: SubscriptionStatus.active,
        currentPeriodEnd: new Date('2026-10-20T12:00:00.000Z'),
        company: { id: 'company-1', name: 'Jeh Doces', deactivatedAt: null },
      },
      {
        plan: SubscriptionPlan.annual,
        status: SubscriptionStatus.pending,
        currentPeriodEnd: new Date('2027-01-20T12:00:00.000Z'),
        company: { id: 'company-2', name: 'Doce Lar', deactivatedAt: null },
      },
      {
        plan: SubscriptionPlan.monthly,
        status: SubscriptionStatus.past_due,
        currentPeriodEnd: new Date('2026-09-20T12:00:00.000Z'),
        company: { id: 'company-3', name: 'Bolos da Ana', deactivatedAt: null },
      },
    ],
    { monthly: 19.8, annual: 179.8 },
    now,
  );

  assert.equal(Math.round(result.summary.receivedRevenue * 100) / 100, 199.6);
  assert.equal(result.summary.currentMonthRevenue, 19.8);
  assert.equal(result.summary.approvedPayments, 2);
  assert.equal(result.summary.paidCompanies, 2);
  assert.deepEqual(result.planDistribution, { monthly: 1, annual: 1 });
  assert.equal(result.summary.pendingSubscriptions, 1);
  assert.equal(result.summary.overdueSubscriptions, 1);
  assert.deepEqual(
    result.expiringSubscriptions.map((item) => item.companyName),
    ['Jeh Doces'],
  );
});

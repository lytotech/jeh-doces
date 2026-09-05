import test from 'node:test';
import assert from 'node:assert/strict';
import { SubscriptionPlan } from '@prisma/client';
import { prisma } from '../../infrastructure/database/client';
import { env } from '../../config/env';
import { BillingService } from './billing.service';

const auth = {
  userId: 'user-1',
  companyId: 'company-1',
  role: 'owner',
  name: 'Teste',
  email: 'teste@example.com',
  sessionId: 'session-1',
} as const;

function subscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'subscription-1',
    companyId: auth.companyId,
    plan: SubscriptionPlan.basic,
    status: 'pending',
    currentPeriodEnd: null,
    mercadoPagoId: null,
    pendingPaymentId: 'payment-1',
    pendingPlan: SubscriptionPlan.monthly,
    mercadoPagoSubscriptionId: null,
    ...overrides,
  } as any;
}

function payment(id: string, referencePlan = 'monthly') {
  return {
    id,
    status: 'approved',
    transaction_amount: 19.8,
    currency_id: 'BRL',
    external_reference: `${auth.companyId}:${referencePlan}:request-1`,
    date_approved: '2026-09-05T15:00:00.000Z',
  };
}

test('webhook aprovado fora de ordem ativa a assinatura e registra o pagamento', async () => {
  const service = new BillingService();
  const current = subscription();
  let paymentUpserts = 0;
  let subscriptionUpdates = 0;
  const originalFetch = globalThis.fetch;
  const originalToken = env.mercadoPagoAccessToken;

  env.mercadoPagoAccessToken = 'test-token';
  globalThis.fetch = (async () =>
    new Response(JSON.stringify(payment('payment-1')), { status: 200 })) as typeof fetch;
  (prisma as any).$transaction = async (callback: (tx: any) => Promise<void>) =>
    callback({
      subscription: {
        findUnique: async () => current,
        update: async ({ data }: any) => {
          subscriptionUpdates += 1;
          Object.assign(current, data);
          return current;
        },
      },
      subscriptionPayment: {
        upsert: async ({ create }: any) => {
          paymentUpserts += 1;
          return { mercadoPagoId: create.mercadoPagoId };
        },
      },
    });

  try {
    await service.processWebhook('payment-1');
    await service.processWebhook('payment-1');
    assert.equal(paymentUpserts, 2, 'o webhook deve ser processável novamente');
    assert.equal(subscriptionUpdates, 1, 'um webhook duplicado não deve criar outro período');
    assert.equal(current.status, 'active');
    assert.equal(current.mercadoPagoId, 'payment-1');
    assert.equal(current.pendingPaymentId, null);
  } finally {
    globalThis.fetch = originalFetch;
    env.mercadoPagoAccessToken = originalToken;
  }
});

test('pagamento aprovado duplicado preserva o período vigente', async () => {
  const service = new BillingService();
  const current = subscription({
    plan: SubscriptionPlan.monthly,
    status: 'active',
    currentPeriodEnd: new Date('2026-10-05T15:00:00.000Z'),
    mercadoPagoId: 'payment-1',
    pendingPaymentId: null,
    pendingPlan: null,
  });
  const originalFetch = globalThis.fetch;
  const originalToken = env.mercadoPagoAccessToken;
  let subscriptionUpdates = 0;

  env.mercadoPagoAccessToken = 'test-token';
  globalThis.fetch = (async () =>
    new Response(JSON.stringify(payment('payment-2')), { status: 200 })) as typeof fetch;
  (prisma as any).$transaction = async (callback: (tx: any) => Promise<void>) =>
    callback({
      subscription: {
        findUnique: async () => current,
        update: async ({ data }: any) => {
          subscriptionUpdates += 1;
          Object.assign(current, data);
          return current;
        },
      },
      subscriptionPayment: {
        upsert: async () => ({ mercadoPagoId: 'payment-2' }),
      },
    });

  try {
    const periodBefore = current.currentPeriodEnd;
    await service.processWebhook('payment-2');
    assert.equal(subscriptionUpdates, 0);
    assert.equal(current.mercadoPagoId, 'payment-1');
    assert.equal(current.currentPeriodEnd, periodBefore);
  } finally {
    globalThis.fetch = originalFetch;
    env.mercadoPagoAccessToken = originalToken;
  }
});

test('sincronização consulta cobrança pendente, vigente e histórico recente sem repetir IDs', async () => {
  const service = new BillingService();
  const processed: string[] = [];
  const recurring: string[] = [];
  (service as any).ensureSubscription = async () =>
    subscription({
      pendingPaymentId: 'payment-1',
      mercadoPagoId: 'payment-2',
      mercadoPagoSubscriptionId: 'recurring-1',
    });
  (prisma as any).subscriptionPayment.findMany = async () => [
    { mercadoPagoId: 'payment-2' },
    { mercadoPagoId: 'payment-3' },
  ];
  (service as any).processWebhook = async (id: string) => processed.push(id);
  (service as any).processRecurringWebhook = async (id: string) => recurring.push(id);
  (service as any).getStatus = async () => ({ ok: true });

  await service.syncPendingPayment(auth.companyId);
  assert.deepEqual(processed.sort(), ['payment-1', 'payment-2', 'payment-3']);
  assert.deepEqual(recurring, ['recurring-1']);
});

test('estorno registra o retorno do Mercado Pago e é restrito ao administrador', async () => {
  const service = new BillingService();
  const originalFetch = globalThis.fetch;
  const originalToken = env.mercadoPagoAccessToken;
  let updated: any;

  env.mercadoPagoAccessToken = 'test-token';
  (prisma as any).subscriptionPayment.findUnique = async () => ({
    mercadoPagoId: 'payment-1',
    status: 'approved',
    subscription: { companyId: auth.companyId },
  });
  (prisma as any).subscriptionPayment.update = async ({ data }: any) => {
    updated = data;
    return updated;
  };
  (service as any).getStatus = async () => ({ ok: true });
  const calls: string[] = [];
  globalThis.fetch = (async (input: URL | RequestInfo, init?: RequestInit) => {
    calls.push(`${init?.method || 'GET'} ${String(input)}`);
    return new Response(
      JSON.stringify(init?.method === 'POST' ? { id: 'refund-1' } : { status: 'approved' }),
      { status: 200 },
    );
  }) as typeof fetch;

  try {
    await assert.rejects(
      service.refundPayment({ ...auth, role: 'employee' }, 'payment-1'),
      /Apenas administradores/,
    );
    await service.refundPayment(auth, 'payment-1');
    assert.deepEqual(updated.status, 'refunded');
    assert.equal(updated.refundId, 'refund-1');
    assert.equal(calls.length, 2);
    assert.match(calls[1], /\/payments\/payment-1\/refunds$/);
  } finally {
    globalThis.fetch = originalFetch;
    env.mercadoPagoAccessToken = originalToken;
  }
});

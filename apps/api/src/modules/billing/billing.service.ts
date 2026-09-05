import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { prisma } from '../../infrastructure/database/client';
import { env } from '../../config/env';
import { AuthContext } from '../../common/auth.types';
import { hasCurrentPaidPeriod } from './plan-limits';

const PRICES: Record<'monthly' | 'annual', number> = { monthly: 19.8, annual: 179.8 };

export function isMercadoPagoSignatureValid(input: {
  signature: string | undefined;
  requestId: string | undefined;
  dataId: string;
  nowMs?: number;
  secret: string;
}) {
  if (!input.signature || !input.requestId || !input.secret) return false;
  const values = Object.fromEntries(
    input.signature.split(',').map((part) => {
      const [key, ...value] = part.trim().split('=');
      return [key, value.join('=')];
    }),
  );
  const timestamp = Number(values.ts);
  const received = values.v1;
  if (
    !Number.isFinite(timestamp) ||
    !received ||
    Math.abs((input.nowMs ?? Date.now()) - timestamp * 1000) > 5 * 60 * 1000
  )
    return false;
  const manifest = `id:${input.dataId};request-id:${input.requestId};ts:${values.ts};`;
  const expected = createHmac('sha256', input.secret).update(manifest).digest('hex');
  const receivedBuffer = Buffer.from(received, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

export function isPaymentAmountValid(
  payment: { transaction_amount?: unknown; currency_id?: unknown },
  plan: 'monthly' | 'annual',
) {
  return (
    Number(payment.transaction_amount) === PRICES[plan] &&
    (!payment.currency_id || payment.currency_id === 'BRL')
  );
}

export function hasActivePaidPlan(
  subscription: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    currentPeriodEnd: Date | null;
  },
  now = new Date(),
) {
  return subscription.plan !== SubscriptionPlan.basic && hasCurrentPaidPeriod(subscription, now);
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  private async ensureSubscription(companyId: string) {
    return prisma.subscription.upsert({
      where: { companyId },
      update: {},
      create: { companyId },
    });
  }

  async getStatus(companyId: string) {
    let subscription = await this.ensureSubscription(companyId);
    const expired =
      subscription.plan !== SubscriptionPlan.basic &&
      (!subscription.currentPeriodEnd || subscription.currentPeriodEnd <= new Date());
    if (expired && subscription.status !== SubscriptionStatus.past_due) {
      subscription = await prisma.subscription.update({
        where: { companyId },
        data: { plan: SubscriptionPlan.basic, status: SubscriptionStatus.past_due },
      });
    }
    return prisma.subscription.findUniqueOrThrow({
      where: { id: subscription.id },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 12 } },
    });
  }

  async syncPendingPayment(companyId: string) {
    const subscription = await this.ensureSubscription(companyId);
    const paymentIds = new Set(
      [subscription.pendingPaymentId, subscription.mercadoPagoId].filter((id): id is string =>
        Boolean(id),
      ),
    );
    const recentPayments = await prisma.subscriptionPayment.findMany({
      where: { subscriptionId: subscription.id },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: { mercadoPagoId: true },
    });
    recentPayments.forEach((payment) => paymentIds.add(payment.mercadoPagoId));
    for (const paymentId of paymentIds) await this.processWebhook(paymentId);
    if (
      subscription.status === SubscriptionStatus.pending &&
      subscription.mercadoPagoSubscriptionId
    ) {
      await this.processRecurringWebhook(subscription.mercadoPagoSubscriptionId);
    }
    return this.getStatus(companyId);
  }

  async cancelPendingPayment(companyId: string, requestedPaymentId?: string) {
    const subscription = await this.ensureSubscription(companyId);
    const payment = requestedPaymentId
      ? await prisma.subscriptionPayment.findFirst({
          where: { mercadoPagoId: requestedPaymentId, subscriptionId: subscription.id },
        })
      : subscription.pendingPaymentId
        ? await prisma.subscriptionPayment.findFirst({
            where: {
              mercadoPagoId: subscription.pendingPaymentId,
              subscriptionId: subscription.id,
            },
          })
        : null;
    const paymentId =
      payment?.mercadoPagoId ||
      (requestedPaymentId && subscription.pendingPaymentId === requestedPaymentId
        ? requestedPaymentId
        : null);
    if (!paymentId) throw new BadRequestException('Não existe cobrança pendente para cancelar.');
    if (payment?.status === 'approved') throw new BadRequestException('Esta cobrança já foi paga.');

    if (env.mercadoPagoAccessToken) {
      const response = await fetch(
        `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${env.mercadoPagoAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'cancelled' }),
        },
      );
      if (!response.ok) {
        this.logger.error(`Não foi possível cancelar a cobrança Pix (${response.status}).`);
        throw new BadRequestException('Não foi possível cancelar a cobrança. Tente novamente.');
      }
    }

    await prisma.$transaction([
      prisma.subscriptionPayment.updateMany({
        where: {
          mercadoPagoId: paymentId,
          subscriptionId: subscription.id,
          status: { not: 'approved' },
        },
        data: { status: 'cancelled', paidAt: null },
      }),
      prisma.subscription.update({
        where: { companyId },
        data:
          subscription.pendingPaymentId === paymentId
            ? { status: SubscriptionStatus.canceled, pendingPaymentId: null, pendingPlan: null }
            : {},
      }),
    ]);
    return this.getStatus(companyId);
  }

  async cancelRenewal(companyId: string) {
    const subscription = await this.ensureSubscription(companyId);
    if (
      subscription.plan === SubscriptionPlan.basic ||
      !subscription.currentPeriodEnd ||
      subscription.currentPeriodEnd <= new Date()
    ) {
      throw new BadRequestException('Não existe uma assinatura ativa para cancelar.');
    }
    if (subscription.mercadoPagoSubscriptionId && env.mercadoPagoAccessToken) {
      const response = await fetch(
        `https://api.mercadopago.com/preapproval/${encodeURIComponent(subscription.mercadoPagoSubscriptionId)}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${env.mercadoPagoAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'cancelled' }),
        },
      );
      if (!response.ok) {
        this.logger.error(
          `Não foi possível cancelar a assinatura recorrente (${response.status}).`,
        );
        throw new BadRequestException('Não foi possível cancelar a renovação. Tente novamente.');
      }
    }
    return prisma.subscription.update({
      where: { companyId },
      data: { status: SubscriptionStatus.canceled },
    });
  }

  private async getPixPayment(paymentId: string) {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: { Authorization: `Bearer ${env.mercadoPagoAccessToken}` },
      },
    );
    if (!response.ok) return null;
    return response.json() as Promise<any>;
  }

  private mapPixPayment(payment: any, plan: 'monthly' | 'annual') {
    return {
      id: String(payment.id),
      plan,
      amount: PRICES[plan],
      status: payment.status,
      qrCode: payment.point_of_interaction?.transaction_data?.qr_code || null,
      qrCodeBase64: payment.point_of_interaction?.transaction_data?.qr_code_base64 || null,
      ticketUrl: payment.point_of_interaction?.transaction_data?.ticket_url || null,
    };
  }

  async createPixPayment(auth: AuthContext, requestedPlan: string) {
    if (requestedPlan !== 'monthly' && requestedPlan !== 'annual') {
      throw new BadRequestException('Plano inválido.');
    }
    if (!env.mercadoPagoAccessToken) {
      throw new BadRequestException('Mercado Pago ainda não está configurado.');
    }
    const plan = requestedPlan as 'monthly' | 'annual';
    const current = await this.ensureSubscription(auth.companyId);
    if (hasActivePaidPlan(current)) {
      throw new BadRequestException(
        'Seu plano já está ativo. Não é necessário gerar uma nova cobrança.',
      );
    }
    if (current.pendingPaymentId && current.pendingPlan === plan) {
      const existing = await this.getPixPayment(current.pendingPaymentId);
      if (existing && !['cancelled', 'canceled', 'rejected'].includes(String(existing.status))) {
        return this.mapPixPayment(existing, plan);
      }
    }
    const reference = `${auth.companyId}:${plan}:${randomUUID()}`;
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.mercadoPagoAccessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': reference,
      },
      body: JSON.stringify({
        transaction_amount: PRICES[plan],
        description: `Confeiti — assinatura ${plan === 'monthly' ? 'mensal' : 'anual'}`,
        payment_method_id: 'pix',
        payer: { email: auth.email },
        external_reference: reference,
        notification_url: env.mercadoPagoWebhookUrl || `${env.appUrl}/api/billing/webhook`,
      }),
    });
    const payment = (await response.json()) as any;
    if (!response.ok) {
      this.logger.error(`Mercado Pago recusou a cobrança (${response.status}).`);
      throw new BadRequestException('Não foi possível gerar o Pix. Tente novamente.');
    }
    await prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.findUniqueOrThrow({
        where: { companyId: auth.companyId },
      });
      await tx.subscriptionPayment.upsert({
        where: { mercadoPagoId: String(payment.id) },
        update: { plan, amount: PRICES[plan], status: String(payment.status || 'pending') },
        create: {
          subscriptionId: subscription.id,
          mercadoPagoId: String(payment.id),
          plan,
          amount: PRICES[plan],
          status: String(payment.status || 'pending'),
        },
      });
      if (!hasCurrentPaidPeriod(subscription)) {
        await tx.subscription.update({
          where: { companyId: auth.companyId },
          data: {
            status: SubscriptionStatus.pending,
            pendingPlan: plan,
            pendingPaymentId: String(payment.id),
          },
        });
      }
    });
    if (payment.status === 'approved') await this.processWebhook(String(payment.id));
    return this.mapPixPayment(payment, plan);
  }

  async createRecurringSubscription(auth: AuthContext, requestedPlan: string) {
    if (requestedPlan !== 'monthly' && requestedPlan !== 'annual')
      throw new BadRequestException('Plano inválido.');
    if (!env.mercadoPagoAccessToken)
      throw new BadRequestException('Mercado Pago ainda não está configurado.');
    const plan = requestedPlan as 'monthly' | 'annual';
    const current = await this.ensureSubscription(auth.companyId);
    if (hasActivePaidPlan(current)) {
      throw new BadRequestException(
        'Seu plano já está ativo. Não é necessário iniciar uma nova assinatura.',
      );
    }
    const reference = `${auth.companyId}:${plan}:${randomUUID()}`;
    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.mercadoPagoAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: `Confeiti — assinatura ${plan === 'monthly' ? 'mensal' : 'anual'}`,
        external_reference: reference,
        payer_email: auth.email,
        auto_recurring: {
          frequency: plan === 'annual' ? 12 : 1,
          frequency_type: 'months',
          transaction_amount: PRICES[plan],
          currency_id: 'BRL',
        },
        back_url: `${env.appUrl}/?billing=return`,
        notification_url: env.mercadoPagoWebhookUrl || `${env.appUrl}/api/billing/webhook`,
      }),
    });
    const subscription = (await response.json()) as any;
    if (!response.ok || !subscription.id || !subscription.init_point) {
      this.logger.error(`Mercado Pago recusou a assinatura recorrente (${response.status}).`);
      throw new BadRequestException(
        'Não foi possível iniciar a assinatura automática. Tente novamente.',
      );
    }
    await prisma.subscription.update({
      where: { companyId: auth.companyId },
      data: {
        status: SubscriptionStatus.pending,
        pendingPlan: plan,
        mercadoPagoSubscriptionId: String(subscription.id),
      },
    });
    return {
      id: String(subscription.id),
      plan,
      amount: PRICES[plan],
      checkoutUrl: String(subscription.init_point),
    };
  }

  async processRecurringWebhook(subscriptionId: string) {
    if (!subscriptionId || !env.mercadoPagoAccessToken) return;
    const response = await fetch(
      `https://api.mercadopago.com/preapproval/${encodeURIComponent(subscriptionId)}`,
      { headers: { Authorization: `Bearer ${env.mercadoPagoAccessToken}` } },
    );
    if (!response.ok) return;
    const remote = (await response.json()) as any;
    const [companyId, plan] = String(remote.external_reference || '').split(':');
    if (!companyId || !['monthly', 'annual'].includes(plan)) return;
    const current = await prisma.subscription.findUnique({ where: { companyId } });
    if (!current || current.mercadoPagoSubscriptionId !== String(remote.id)) return;
    if (remote.status === 'authorized' || remote.status === 'active') {
      const end = new Date();
      if (plan === 'annual') end.setFullYear(end.getFullYear() + 1);
      else end.setMonth(end.getMonth() + 1);
      await prisma.subscription.update({
        where: { companyId },
        data: {
          plan: plan as SubscriptionPlan,
          status: SubscriptionStatus.active,
          currentPeriodEnd: end,
          pendingPlan: null,
        },
      });
    } else if (['paused', 'cancelled', 'canceled'].includes(String(remote.status))) {
      await prisma.subscription.update({
        where: { companyId },
        data: { status: SubscriptionStatus.canceled },
      });
    }
  }

  async processWebhook(paymentId: string) {
    if (!paymentId || !env.mercadoPagoAccessToken) return;
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: { Authorization: `Bearer ${env.mercadoPagoAccessToken}` },
      },
    );
    if (!response.ok) return;
    const payment = (await response.json()) as any;
    const [companyId, plan] = String(payment.external_reference || '').split(':');
    if (!companyId || !['monthly', 'annual'].includes(plan)) return;
    if (!isPaymentAmountValid(payment, plan as 'monthly' | 'annual')) {
      this.logger.warn(`Pagamento ${payment.id} rejeitado por valor ou moeda incompatível.`);
      return;
    }
    const end = new Date();
    if (plan === 'annual') end.setFullYear(end.getFullYear() + 1);
    else end.setMonth(end.getMonth() + 1);
    await prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.findUnique({ where: { companyId } });
      if (!subscription) return;
      const remoteStatus = String(payment.status || 'pending');
      const paymentRecord = await tx.subscriptionPayment.upsert({
        where: { mercadoPagoId: String(payment.id) },
        update: {
          plan: plan as SubscriptionPlan,
          amount: Number(payment.transaction_amount),
          status: remoteStatus,
          paidAt:
            remoteStatus === 'approved' ? new Date(payment.date_approved || Date.now()) : null,
        },
        create: {
          subscriptionId: subscription.id,
          mercadoPagoId: String(payment.id),
          plan: plan as SubscriptionPlan,
          amount: Number(payment.transaction_amount),
          status: remoteStatus,
          paidAt:
            remoteStatus === 'approved' ? new Date(payment.date_approved || Date.now()) : null,
        },
      });
      if (remoteStatus !== 'approved') return;

      const hasPaidPeriod = hasCurrentPaidPeriod(subscription);
      const isCurrentPayment = subscription.mercadoPagoId === String(payment.id);
      if (!hasPaidPeriod) {
        await tx.subscription.update({
          where: { companyId },
          data: {
            plan: plan as SubscriptionPlan,
            status: SubscriptionStatus.active,
            currentPeriodEnd: end,
            mercadoPagoId: String(payment.id),
            pendingPaymentId: null,
            pendingPlan: null,
          },
        });
      } else if (
        (isCurrentPayment && subscription.status !== SubscriptionStatus.active) ||
        subscription.pendingPaymentId === String(payment.id)
      ) {
        await tx.subscription.update({
          where: { companyId },
          data: {
            status: SubscriptionStatus.active,
            pendingPaymentId:
              subscription.pendingPaymentId === String(payment.id)
                ? null
                : subscription.pendingPaymentId,
            pendingPlan:
              subscription.pendingPaymentId === String(payment.id)
                ? null
                : subscription.pendingPlan,
          },
        });
      } else {
        this.logger.warn(
          `Pagamento aprovado duplicado ${paymentRecord.mercadoPagoId}; período vigente preservado.`,
        );
      }
    });
  }

  async refundPayment(auth: AuthContext, paymentId: string) {
    if (auth.role === 'employee')
      throw new ForbiddenException('Apenas administradores podem estornar pagamentos.');
    const subscriptionPayment = await prisma.subscriptionPayment.findUnique({
      where: { mercadoPagoId: paymentId },
      include: { subscription: true },
    });
    if (!subscriptionPayment || subscriptionPayment.subscription.companyId !== auth.companyId)
      throw new BadRequestException('Pagamento não encontrado.');
    if (subscriptionPayment.status === 'refunded') return this.getStatus(auth.companyId);
    if (!env.mercadoPagoAccessToken)
      throw new BadRequestException('Mercado Pago ainda não está configurado.');
    const remote = await this.getPixPayment(paymentId);
    if (!remote || remote.status !== 'approved')
      throw new BadRequestException('Somente pagamentos aprovados podem ser estornados.');
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}/refunds`,
      { method: 'POST', headers: { Authorization: `Bearer ${env.mercadoPagoAccessToken}` } },
    );
    const refund = (await response.json()) as { id?: string };
    if (!response.ok) {
      this.logger.error(`Não foi possível estornar o pagamento ${paymentId} (${response.status}).`);
      throw new BadRequestException('Não foi possível estornar o pagamento. Tente novamente.');
    }
    await prisma.subscriptionPayment.update({
      where: { mercadoPagoId: paymentId },
      data: {
        status: 'refunded',
        refundedAt: new Date(),
        refundId: refund.id ? String(refund.id) : null,
      },
    });
    this.logger.log(`Pagamento ${paymentId} estornado para a empresa ${auth.companyId}.`);
    return this.getStatus(auth.companyId);
  }

  validateWebhookSignature(
    signature: string | undefined,
    requestId: string | undefined,
    dataId: string,
  ) {
    if (!env.mercadoPagoWebhookSecret) {
      this.logger.warn(
        'MERCADOPAGO_WEBHOOK_SECRET não configurado; webhook aceito sem validação de assinatura.',
      );
      return true;
    }
    return isMercadoPagoSignatureValid({
      signature,
      requestId,
      dataId,
      secret: env.mercadoPagoWebhookSecret,
    });
  }
}

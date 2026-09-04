import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { prisma } from '../../infrastructure/database/client';
import { env } from '../../config/env';
import { AuthContext } from '../../common/auth.types';

const PRICES: Record<'monthly' | 'annual', number> = { monthly: 9.9, annual: 89.9 };

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
    const subscription = await this.ensureSubscription(companyId);
    const expired = subscription.plan !== SubscriptionPlan.basic &&
      (!subscription.currentPeriodEnd || subscription.currentPeriodEnd <= new Date());
    if (expired && subscription.status !== SubscriptionStatus.past_due) {
      return prisma.subscription.update({
        where: { companyId },
        data: { plan: SubscriptionPlan.basic, status: SubscriptionStatus.past_due },
      });
    }
    return subscription;
  }

  async createPixPayment(auth: AuthContext, requestedPlan: string) {
    if (requestedPlan !== 'monthly' && requestedPlan !== 'annual') {
      throw new BadRequestException('Plano inválido.');
    }
    if (!env.mercadoPagoAccessToken) {
      throw new BadRequestException('Mercado Pago ainda não está configurado.');
    }
    const plan = requestedPlan as 'monthly' | 'annual';
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
    const payment = await response.json() as any;
    if (!response.ok) {
      this.logger.error(`Mercado Pago recusou a cobrança (${response.status}).`);
      throw new BadRequestException('Não foi possível gerar o Pix. Tente novamente.');
    }
    await prisma.subscription.update({
      where: { companyId: auth.companyId },
      data: { status: SubscriptionStatus.pending, pendingPlan: plan, pendingPaymentId: String(payment.id) },
    });
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

  async processWebhook(paymentId: string) {
    if (!paymentId || !env.mercadoPagoAccessToken) return;
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${env.mercadoPagoAccessToken}` },
    });
    if (!response.ok) return;
    const payment = await response.json() as any;
    const [companyId, plan] = String(payment.external_reference || '').split(':');
    if (!companyId || !['monthly', 'annual'].includes(plan)) return;
    const subscription = await prisma.subscription.findUnique({ where: { companyId } });
    if (!subscription || subscription.pendingPaymentId !== String(payment.id)) return;
    if (payment.status !== 'approved') return;
    const end = new Date();
    if (plan === 'annual') end.setFullYear(end.getFullYear() + 1);
    else end.setMonth(end.getMonth() + 1);
    await prisma.subscription.update({
      where: { companyId },
      data: { plan: plan as SubscriptionPlan, status: SubscriptionStatus.active, currentPeriodEnd: end, mercadoPagoId: String(payment.id), pendingPaymentId: null, pendingPlan: null },
    });
  }
}

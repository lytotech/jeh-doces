import { ForbiddenException } from '@nestjs/common';
import { SubscriptionPlan } from '@prisma/client';
import { prisma } from '../../infrastructure/database/client';

export const BASIC_LIMITS = {
  products: 10,
  materials: 20,
  ingredients: 30,
  ordersPerMonth: 20,
} as const;

export const canCreateWithinLimit = (currentCount: number, limit: number) => currentCount < limit;

export function hasCurrentPaidPeriod(
  subscription: {
    plan: SubscriptionPlan;
    status: string;
    currentPeriodEnd: Date | null;
  },
  now = new Date(),
) {
  return (
    subscription.plan !== SubscriptionPlan.basic &&
    ['active', 'pending', 'canceled'].includes(subscription.status) &&
    !!subscription.currentPeriodEnd &&
    subscription.currentPeriodEnd > now
  );
}

export async function isCompletePlan(companyId: string) {
  const subscription = await prisma.subscription.findUnique({ where: { companyId } });
  return Boolean(subscription && hasCurrentPaidPeriod(subscription));
}

export async function assertCanCreate(
  companyId: string,
  resource: keyof typeof BASIC_LIMITS,
  currentCount: number,
) {
  if (await isCompletePlan(companyId)) return;
  const limit = BASIC_LIMITS[resource];
  if (!canCreateWithinLimit(currentCount, limit))
    throw new ForbiddenException(
      `O plano Básico permite até ${limit} ${resource === 'ordersPerMonth' ? 'encomendas por mês' : resource}. Assine o Completo para continuar.`,
    );
}

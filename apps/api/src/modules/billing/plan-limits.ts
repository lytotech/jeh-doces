import { ForbiddenException } from '@nestjs/common';
import { SubscriptionPlan } from '@prisma/client';
import { prisma } from '../../infrastructure/database/client';

export const BASIC_LIMITS = { products: 10, materials: 20, ingredients: 30, ordersPerMonth: 20 } as const;

export const canCreateWithinLimit = (currentCount: number, limit: number) => currentCount < limit;

export async function isCompletePlan(companyId: string) {
  const subscription = await prisma.subscription.findUnique({ where: { companyId } });
  return Boolean(subscription && subscription.plan !== SubscriptionPlan.basic && subscription.status === 'active' && subscription.currentPeriodEnd && subscription.currentPeriodEnd > new Date());
}

export async function assertCanCreate(companyId: string, resource: keyof typeof BASIC_LIMITS, currentCount: number) {
  if (await isCompletePlan(companyId)) return;
  const limit = BASIC_LIMITS[resource];
  if (!canCreateWithinLimit(currentCount, limit)) throw new ForbiddenException(`O plano Básico permite até ${limit} ${resource === 'ordersPerMonth' ? 'encomendas por mês' : resource}. Assine o Completo para continuar.`);
}

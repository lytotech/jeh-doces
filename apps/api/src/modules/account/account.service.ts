import { BadRequestException, Injectable } from '@nestjs/common';
import { prisma } from '../../infrastructure/database/client';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

const DELETION_DAYS = 90;
export const deletionDateFrom = (from: Date) => new Date(from.getTime() + DELETION_DAYS * 24 * 60 * 60 * 1000);

@Injectable()
export class AccountService {
  async status(companyId: string) {
    return prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      select: { deletionRequestedAt: true, deletionScheduledFor: true, deactivatedAt: true },
    });
  }

  async requestDeletion(companyId: string) {
    const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
    if (company.deactivatedAt) throw new BadRequestException('Esta empresa já está inativa.');
    const scheduled = deletionDateFrom(new Date());
    await prisma.$transaction([
      prisma.company.update({ where: { id: companyId }, data: { deletionRequestedAt: new Date(), deletionScheduledFor: scheduled } }),
      prisma.subscription.upsert({ where: { companyId }, update: { plan: SubscriptionPlan.basic, status: SubscriptionStatus.canceled, currentPeriodEnd: null, pendingPaymentId: null, pendingPlan: null }, create: { companyId, plan: SubscriptionPlan.basic, status: SubscriptionStatus.canceled } }),
    ]);
    return { deletionScheduledFor: scheduled.toISOString() };
  }

  async cancelDeletion(companyId: string) {
    const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
    if (company.deactivatedAt) throw new BadRequestException('A empresa já foi inativada e precisa ser reativada pelo suporte.');
    return prisma.company.update({ where: { id: companyId }, data: { deletionRequestedAt: null, deletionScheduledFor: null } });
  }

  async deactivateScheduledCompanies() {
    return prisma.company.updateMany({ where: { deactivatedAt: null, deletionScheduledFor: { lte: new Date() } }, data: { deactivatedAt: new Date() } });
  }
}

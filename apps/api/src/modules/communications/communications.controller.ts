import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CompanyContextInterceptor } from '../../common/company-context.interceptor';
import { getCompanyId, prisma } from '../../infrastructure/database/client';
import { AuthGuard } from '../auth/auth.guard';

/** Creates each automatic reminder at most once per order and reminder kind. */
export async function reconcileAutomaticReminders() {
  const now = new Date();
  const settings = await prisma.setting.findMany({
    where: { OR: [{ automaticDeliveryReminders: true }, { automaticPaymentReminders: true }] },
    select: {
      companyId: true,
      automaticDeliveryReminders: true,
      automaticPaymentReminders: true,
      deliveryReminderHours: true,
      paymentReminderDays: true,
    },
  });

  for (const setting of settings) {
    const orders = await prisma.order.findMany({
      where: {
        companyId: setting.companyId,
        status: { notIn: ['cancelado', 'entregue'] },
        OR: [
          setting.automaticDeliveryReminders
            ? {
                deliveryDate: {
                  gt: now,
                  lte: new Date(now.getTime() + setting.deliveryReminderHours * 60 * 60 * 1000),
                },
              }
            : { id: '__disabled_delivery__' },
          setting.automaticPaymentReminders
            ? {
                createdAt: {
                  lte: new Date(now.getTime() - setting.paymentReminderDays * 24 * 60 * 60 * 1000),
                },
              }
            : { id: '__disabled_payment__' },
        ],
      },
      select: {
        id: true,
        deliveryDate: true,
        totalCharged: true,
        clientPhone: true,
        payments: { select: { amount: true } },
      },
    });

    for (const order of orders) {
      const remaining =
        order.totalCharged - order.payments.reduce((sum, payment) => sum + payment.amount, 0);
      const deliveryDueAt = new Date(
        order.deliveryDate.getTime() - setting.deliveryReminderHours * 60 * 60 * 1000,
      );
      if (setting.automaticDeliveryReminders && order.clientPhone && deliveryDueAt <= now) {
        await prisma.automaticReminder.upsert({
          where: { orderId_kind: { orderId: order.id, kind: 'delivery' } },
          create: {
            companyId: setting.companyId,
            orderId: order.id,
            kind: 'delivery',
            dueAt: deliveryDueAt,
          },
          update: { dueAt: deliveryDueAt },
        });
      }
      const paymentDueAt = new Date(
        order.deliveryDate.getTime() - setting.paymentReminderDays * 24 * 60 * 60 * 1000,
      );
      if (
        setting.automaticPaymentReminders &&
        order.clientPhone &&
        remaining > 0 &&
        paymentDueAt <= now
      ) {
        await prisma.automaticReminder.upsert({
          where: { orderId_kind: { orderId: order.id, kind: 'payment' } },
          create: {
            companyId: setting.companyId,
            orderId: order.id,
            kind: 'payment',
            dueAt: paymentDueAt,
          },
          update: { dueAt: paymentDueAt },
        });
      }
    }
  }
}

const statuses = new Set([
  'orcamento',
  'confirmado',
  'produzindo',
  'pronto',
  'entregue',
  'cancelado',
]);

@Controller('api/communications')
@UseGuards(AuthGuard)
@UseInterceptors(CompanyContextInterceptor)
export class CommunicationsController {
  @Get('reminders')
  async reminders() {
    const companyId = getCompanyId();
    await reconcileAutomaticReminders();
    const reminders = await prisma.automaticReminder.findMany({
      where: { companyId, status: 'pending', dueAt: { lte: new Date() } },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            clientName: true,
            clientPhone: true,
            deliveryDate: true,
            status: true,
            totalCharged: true,
            payments: { select: { amount: true } },
          },
        },
      },
      orderBy: { dueAt: 'asc' },
    });
    return reminders.filter((reminder) => {
      if (['cancelado', 'entregue'].includes(reminder.order.status)) return false;
      if (reminder.kind !== 'payment') return true;
      const paid = reminder.order.payments.reduce((sum, payment) => sum + payment.amount, 0);
      return reminder.order.totalCharged > paid;
    });
  }

  @Post('reminders/:id/:action')
  async updateReminder(@Param('id') id: string, @Param('action') action: string) {
    if (!['complete', 'dismiss'].includes(action)) {
      throw new BadRequestException('Ação de lembrete inválida.');
    }
    const reminder = await prisma.automaticReminder.updateMany({
      where: { id, companyId: getCompanyId(), status: 'pending' },
      data: { status: action === 'complete' ? 'completed' : 'dismissed' },
    });
    if (!reminder.count) throw new BadRequestException('Lembrete não encontrado.');
    return { success: true };
  }

  @Get('orders/:orderId')
  list(@Param('orderId') orderId: string) {
    return prisma.communication.findMany({
      where: { companyId: getCompanyId(), orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  async create(@Body() body: any) {
    const status = typeof body?.status === 'string' ? body.status : '';
    const template = typeof body?.template === 'string' ? body.template.trim() : '';
    const orderId = typeof body?.orderId === 'string' ? body.orderId : '';
    if (!orderId || !statuses.has(status) || !template) {
      throw new BadRequestException('Dados da comunicação inválidos.');
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, companyId: getCompanyId() },
    });
    if (!order) throw new BadRequestException('Encomenda não encontrada.');

    return prisma.communication.create({
      data: {
        companyId: getCompanyId(),
        orderId,
        channel: 'whatsapp',
        template: template.slice(0, 80),
        status: status as any,
        recipient: typeof body?.recipient === 'string' ? body.recipient.slice(0, 40) : null,
      },
    });
  }
}

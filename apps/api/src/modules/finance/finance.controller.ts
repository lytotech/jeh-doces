import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CompanyContextInterceptor } from '../../common/company-context.interceptor';
import { getCompanyId, prisma } from '../../infrastructure/database/client';
import { AuthGuard } from '../auth/auth.guard';

const asDate = (value: unknown, fallback: Date) => {
  if (typeof value !== 'string' || !value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new BadRequestException('Período inválido.');
  return parsed;
};

export const range = (from: unknown, to: unknown) => {
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const start = asDate(from, defaultFrom);
  const end = asDate(to, defaultTo);
  if (start > end) throw new BadRequestException('A data inicial deve ser anterior à final.');
  return { start, end };
};

export const expenseData = (body: any) => {
  const description = typeof body?.description === 'string' ? body.description.trim() : '';
  const amount = Number(body?.amount);
  const occurredAt = new Date(body?.occurredAt || Date.now());
  if (!description) throw new BadRequestException('Informe a descrição da despesa.');
  if (!Number.isFinite(amount) || amount <= 0)
    throw new BadRequestException('A despesa deve ter um valor maior que zero.');
  if (Number.isNaN(occurredAt.getTime())) throw new BadRequestException('Data inválida.');
  return {
    description: description.slice(0, 160),
    category:
      typeof body?.category === 'string' && body.category.trim()
        ? body.category.trim().slice(0, 80)
        : 'Outros',
    amount,
    occurredAt,
    notes: typeof body?.notes === 'string' ? body.notes.trim().slice(0, 500) || null : null,
  };
};

@Controller('api')
@UseGuards(AuthGuard)
@UseInterceptors(CompanyContextInterceptor)
export class FinanceController {
  @Get('expenses')
  list(@Query('from') from?: string, @Query('to') to?: string) {
    const { start, end } = range(from, to);
    return prisma.expense.findMany({
      where: { companyId: getCompanyId(), occurredAt: { gte: start, lte: end } },
      orderBy: { occurredAt: 'desc' },
    });
  }

  @Post('expenses')
  create(@Body() body: any) {
    return prisma.expense.create({ data: { ...expenseData(body), companyId: getCompanyId() } });
  }

  @Put('expenses/:id')
  update(@Param('id') id: string, @Body() body: any) {
    return prisma.expense
      .updateMany({
        where: { id, companyId: getCompanyId() },
        data: expenseData(body),
      })
      .then(async (result) => {
        if (!result.count) throw new BadRequestException('Despesa não encontrada.');
        return prisma.expense.findUniqueOrThrow({ where: { id } });
      });
  }

  @Delete('expenses/:id')
  async remove(@Param('id') id: string) {
    const result = await prisma.expense.deleteMany({ where: { id, companyId: getCompanyId() } });
    if (!result.count) throw new BadRequestException('Despesa não encontrada.');
    return { success: true };
  }

  @Get('finance/summary')
  async summary(@Query('from') from?: string, @Query('to') to?: string) {
    const { start, end } = range(from, to);
    const companyId = getCompanyId();
    const [expenses, orders] = await Promise.all([
      prisma.expense.findMany({
        where: { companyId, occurredAt: { gte: start, lte: end } },
        select: { amount: true },
      }),
      prisma.order.findMany({
        where: { companyId, createdAt: { gte: start, lte: end }, status: { not: 'cancelado' } },
        select: {
          totalCharged: true,
          estimatedProfit: true,
          payments: { where: { paidAt: { gte: start, lte: end } }, select: { amount: true } },
        },
      }),
    ]);
    const expensesTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
    const salesTotal = orders.reduce((sum, order) => sum + order.totalCharged, 0);
    const receivedTotal = orders.reduce(
      (sum, order) =>
        sum + order.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0),
      0,
    );
    return {
      from: start.toISOString(),
      to: end.toISOString(),
      salesTotal,
      receivedTotal,
      receivableTotal: Math.max(0, salesTotal - receivedTotal),
      expensesTotal,
      netCash: receivedTotal - expensesTotal,
      estimatedProfit:
        orders.reduce((sum, order) => sum + order.estimatedProfit, 0) - expensesTotal,
      ordersCount: orders.length,
    };
  }
}

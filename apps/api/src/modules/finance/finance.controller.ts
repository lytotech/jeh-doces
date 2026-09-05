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

export const buildOperationalReport = (orders: any[]) => {
  const products = new Map<string, { name: string; quantity: number; revenue: number }>();
  const customers = new Map<string, { name: string; orders: number; revenue: number }>();
  const materials = new Map<string, { name: string; quantity: number; cost: number }>();

  let salesTotal = 0;
  let receivedTotal = 0;
  let estimatedCost = 0;
  let estimatedProfit = 0;

  for (const order of orders) {
    salesTotal += order.totalCharged;
    estimatedCost += order.estimatedCost;
    estimatedProfit += order.estimatedProfit;
    receivedTotal += (order.payments || []).reduce(
      (sum: number, payment: any) => sum + payment.amount,
      0,
    );

    const customerKey = order.customerId || order.clientName || order.id;
    const customer = customers.get(customerKey) || {
      name: order.clientName || 'Cliente avulso',
      orders: 0,
      revenue: 0,
    };
    customer.orders += 1;
    customer.revenue += order.totalCharged;
    customers.set(customerKey, customer);

    for (const item of order.items || []) {
      const product = products.get(item.productId) || {
        name: item.productName,
        quantity: 0,
        revenue: 0,
      };
      product.quantity += item.quantity;
      product.revenue += item.totalPrice;
      products.set(item.productId, product);
    }

    for (const item of order.materials || []) {
      const material = materials.get(item.materialId) || {
        name: item.materialName,
        quantity: 0,
        cost: 0,
      };
      material.quantity += item.quantity;
      material.cost += item.totalCost;
      materials.set(item.materialId, material);
    }
  }

  return {
    salesTotal,
    receivedTotal,
    receivableTotal: Math.max(0, salesTotal - receivedTotal),
    estimatedCost,
    estimatedProfit,
    marginPercent: salesTotal > 0 ? (estimatedProfit / salesTotal) * 100 : 0,
    ordersCount: orders.length,
    topProducts: [...products.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 10),
    recurringCustomers: [...customers.values()]
      .filter((customer) => customer.orders > 1)
      .sort((a, b) => b.orders - a.orders || b.revenue - a.revenue)
      .slice(0, 10),
    materialConsumption: [...materials.values()].sort((a, b) => b.cost - a.cost).slice(0, 10),
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

  @Get('finance/report')
  async report(@Query('from') from?: string, @Query('to') to?: string) {
    const { start, end } = range(from, to);
    const orders = await prisma.order.findMany({
      where: {
        companyId: getCompanyId(),
        createdAt: { gte: start, lte: end },
        status: { not: 'cancelado' },
      },
      select: {
        id: true,
        customerId: true,
        clientName: true,
        totalCharged: true,
        estimatedCost: true,
        estimatedProfit: true,
        items: {
          select: { productId: true, productName: true, quantity: true, totalPrice: true },
        },
        materials: {
          select: { materialId: true, materialName: true, quantity: true, totalCost: true },
        },
        payments: { where: { paidAt: { gte: start, lte: end } }, select: { amount: true } },
      },
    });
    return { from: start.toISOString(), to: end.toISOString(), ...buildOperationalReport(orders) };
  }
}

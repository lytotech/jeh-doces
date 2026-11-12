import test from 'node:test';
import assert from 'node:assert/strict';
import { BadRequestException } from '@nestjs/common';
import {
  buildOperationalReport,
  calculateNetCash,
  cashOpeningData,
  expenseData,
  FinanceController,
  range,
} from './finance.controller';
import { prisma, runForCompany } from '../../infrastructure/database/client';

test('normaliza um lançamento financeiro válido', () => {
  const data = expenseData({
    description: 'Compra de chocolate',
    category: 'Insumos',
    amount: '25.90',
    occurredAt: '2026-09-05',
    notes: 'Fornecedor local',
  });
  assert.equal(data.description, 'Compra de chocolate');
  assert.equal(data.category, 'Insumos');
  assert.equal(data.amount, 25.9);
  assert.equal(data.notes, 'Fornecedor local');
  assert.equal(data.occurredAt.toISOString(), '2026-09-05T00:00:00.000Z');
});

test('recusa despesas sem descrição, valor ou com data inválida', () => {
  assert.throws(() => expenseData({ amount: 10 }), BadRequestException);
  assert.throws(() => expenseData({ description: 'Taxa', amount: 0 }), BadRequestException);
  assert.throws(
    () => expenseData({ description: 'Taxa', amount: 10, occurredAt: 'data inválida' }),
    BadRequestException,
  );
});

test('normaliza uma abertura de caixa válida', () => {
  const data = cashOpeningData({
    amount: '200.00',
    occurredAt: '2026-09-01',
    notes: 'Dinheiro já disponível',
  });
  assert.equal(data.amount, 200);
  assert.equal(data.occurredAt.toISOString(), '2026-09-01T00:00:00.000Z');
  assert.equal(data.notes, 'Dinheiro já disponível');
  assert.equal(calculateNetCash(data.amount, 150, 0), 350);
  assert.equal(calculateNetCash(data.amount, 150, 30), 320);
});

test('recusa saldo inicial sem valor positivo ou com data inválida', () => {
  assert.throws(() => cashOpeningData({ amount: 0 }), BadRequestException);
  assert.throws(() => cashOpeningData({ amount: -10 }), BadRequestException);
  assert.throws(
    () => cashOpeningData({ amount: 200, occurredAt: 'data inválida' }),
    BadRequestException,
  );
});

test('valida o intervalo do resumo financeiro', () => {
  const result = range('2026-09-01', '2026-09-30');
  assert.equal(result.start.toISOString(), '2026-09-01T00:00:00.000Z');
  assert.equal(result.end.toISOString(), '2026-09-30T00:00:00.000Z');
  assert.throws(() => range('2026-10-01', '2026-09-30'), BadRequestException);
});

test('consolida relatório operacional sem misturar clientes ou produtos', () => {
  const report = buildOperationalReport([
    {
      id: 'order-1',
      customerId: 'customer-1',
      clientName: 'Camila',
      totalCharged: 100,
      estimatedCost: 40,
      estimatedProfit: 60,
      payments: [{ amount: 50 }],
      items: [{ productId: 'product-1', productName: 'Bolo', quantity: 2, totalPrice: 100 }],
      materials: [{ materialId: 'material-1', materialName: 'Caixa', quantity: 2, totalCost: 10 }],
    },
    {
      id: 'order-2',
      customerId: 'customer-1',
      clientName: 'Camila',
      totalCharged: 30,
      estimatedCost: 10,
      estimatedProfit: 20,
      payments: [{ amount: 30 }],
      items: [{ productId: 'product-1', productName: 'Bolo', quantity: 1, totalPrice: 30 }],
      materials: [{ materialId: 'material-1', materialName: 'Caixa', quantity: 1, totalCost: 5 }],
    },
  ]);

  assert.equal(report.salesTotal, 130);
  assert.equal(report.receivedTotal, 80);
  assert.equal(report.receivableTotal, 50);
  assert.equal(report.marginPercent, (80 / 130) * 100);
  assert.deepEqual(report.topProducts[0], { name: 'Bolo', quantity: 3, revenue: 130 });
  assert.deepEqual(report.recurringCustomers[0], {
    name: 'Camila',
    orders: 2,
    revenue: 130,
  });
  assert.deepEqual(report.materialConsumption[0], { name: 'Caixa', quantity: 3, cost: 15 });
});

test(
  'caixa contabiliza pagamentos antes, no dia e depois da entrega de pedidos antigos',
  {
    skip: !process.env.FINANCE_TEST_DATABASE,
  },
  async () => {
    const company = await prisma.company.create({ data: { name: 'Finance regression' } });
    const other = await prisma.company.create({ data: { name: 'Other company' } });
    const createOrder = (
      orderNumber: string,
      companyId: string,
      deliveryDate: string,
      paidAt: string,
      amount: number,
      status: 'orcamento' | 'cancelado' = 'orcamento',
      createdAt = '2026-10-01T12:00:00Z',
      totalCharged = amount,
    ) =>
      prisma.order.create({
        data: {
          companyId,
          orderNumber,
          deliveryDate: new Date(deliveryDate),
          createdAt: new Date(createdAt),
          status,
          totalCharged,
          payments: { create: { paidAt: new Date(paidAt), amount, method: 'pix' } },
        },
      });
    try {
      for (const day of ['10', '12', '14']) {
        await createOrder(
          `#${day}`,
          company.id,
          `2026-11-${day}T12:00:00Z`,
          '2026-11-12T12:00:00Z',
          10,
        );
      }
      await createOrder(
        '#cancel',
        company.id,
        '2026-11-10T12:00:00Z',
        '2026-11-12T12:00:00Z',
        50,
        'cancelado',
      );
      await createOrder('#other', other.id, '2026-11-10T12:00:00Z', '2026-11-12T12:00:00Z', 90);
      await createOrder('#future', company.id, '2026-11-10T12:00:00Z', '2026-11-20T12:00:00Z', 80);
      await createOrder(
        '#current',
        company.id,
        '2026-11-10T12:00:00Z',
        '2026-11-09T12:00:00Z',
        50,
        'orcamento',
        '2026-11-01T12:00:00Z',
        200,
      );
      await prisma.cashOpeningBalance.create({
        data: {
          companyId: company.id,
          amount: 100,
          occurredAt: new Date('2026-11-10T00:00:00Z'),
        },
      });
      const summary = await runForCompany(company.id, () =>
        new FinanceController().summary('2026-11-01T00:00:00Z', '2026-11-12T23:59:59Z'),
      );
      assert.equal(summary.receivedTotal, 30);
      assert.equal(summary.netCash, 130);
      assert.equal(summary.salesTotal, 200);
      assert.equal(summary.receivableTotal, 150);
    } finally {
      await prisma.company.deleteMany({ where: { id: { in: [company.id, other.id] } } });
      await prisma.$disconnect();
    }
  },
);

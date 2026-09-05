import test from 'node:test';
import assert from 'node:assert/strict';
import { BadRequestException } from '@nestjs/common';
import { buildOperationalReport, expenseData, range } from './finance.controller';

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

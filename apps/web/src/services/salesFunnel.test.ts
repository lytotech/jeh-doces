import assert from 'node:assert/strict';
import test from 'node:test';
import { Order } from '../types';
import { getSalesFunnelSummary } from './salesFunnel';

const order = (id: string, status: Order['status'], totalCharged: number): Order => ({
  id,
  orderNumber: `#${id}`,
  clientName: `Cliente ${id}`,
  deliveryDate: null,
  status,
  items: [],
  materials: [],
  subtotal: totalCharged,
  discount: 0,
  totalCharged,
  estimatedCost: 0,
  estimatedProfit: totalCharged,
  profitMarginPercent: 100,
  payments: [],
  notes: undefined,
  stockDecremented: false,
  createdAt: '',
  updatedAt: '',
});

test('agrupa pedidos por etapa e soma os valores', () => {
  const summary = getSalesFunnelSummary([
    order('1', 'orcamento', 100),
    order('2', 'orcamento', 50),
    order('3', 'confirmado', 200),
  ]);

  assert.deepEqual(
    summary.stages.map(({ status, count, totalValue }) => ({ status, count, totalValue })),
    [
      { status: 'orcamento', count: 2, totalValue: 150 },
      { status: 'confirmado', count: 1, totalValue: 200 },
      { status: 'produzindo', count: 0, totalValue: 0 },
      { status: 'pronto', count: 0, totalValue: 0 },
      { status: 'entregue', count: 0, totalValue: 0 },
    ],
  );
});

test('mantém cancelados fora do fluxo ativo e os resume como perdas', () => {
  const summary = getSalesFunnelSummary([order('1', 'cancelado', 80), order('2', 'entregue', 120)]);

  assert.equal(summary.canceled.count, 1);
  assert.equal(summary.canceled.totalValue, 80);
  assert.equal(summary.stages.find((stage) => stage.status === 'entregue')?.count, 1);
  assert.equal(
    summary.stages.some((stage) => stage.status === 'cancelado'),
    false,
  );
});

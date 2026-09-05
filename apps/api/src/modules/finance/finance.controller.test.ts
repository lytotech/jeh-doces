import test from 'node:test';
import assert from 'node:assert/strict';
import { BadRequestException } from '@nestjs/common';
import { expenseData, range } from './finance.controller';

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

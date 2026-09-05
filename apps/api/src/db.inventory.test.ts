import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMaterialDeductions } from './db';

test('calcula baixa de materiais manuais e da receita', () => {
  const result = calculateMaterialDeductions(
    [{ productId: 'product-1', quantity: 3 }],
    [{ materialId: 'box', quantity: 1 }],
    [
      { productId: 'product-1', materialId: 'box', quantity: 2 },
      { productId: 'product-1', materialId: 'label', quantity: 1 },
    ],
  );
  assert.deepEqual(
    [...result.entries()],
    [
      ['box', 7],
      ['label', 3],
    ],
  );
});

test('não mistura materiais de outros produtos', () => {
  const result = calculateMaterialDeductions(
    [{ productId: 'product-1', quantity: 1 }],
    [],
    [{ productId: 'product-2', materialId: 'unrelated', quantity: 99 }],
  );
  assert.equal(result.size, 0);
});

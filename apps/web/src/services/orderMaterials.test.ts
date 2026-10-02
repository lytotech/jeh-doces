import assert from 'node:assert/strict';
import test from 'node:test';
import { Material, OrderProductItem, Product } from '../types';
import {
  EditableOrderMaterial,
  parseNonNegativeQuantity,
  syncOrderMaterials,
} from './orderMaterials';

const materials: Material[] = [
  {
    id: 'box',
    name: 'Caixa',
    category: 'Embalagens',
    unit: 'un',
    baseQuantity: 1,
    totalCost: 5,
    unitCost: 5,
    trackStock: true,
    stockQuantity: 100,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'label',
    name: 'Etiqueta',
    category: 'Embalagens',
    unit: 'un',
    baseQuantity: 1,
    totalCost: 1,
    unitCost: 1,
    trackStock: true,
    stockQuantity: 100,
    createdAt: '',
    updatedAt: '',
  },
];

const products: Product[] = [
  {
    id: 'product-a',
    name: 'Produto A',
    salePrice: 10,
    ingredients: [],
    materials: [
      { materialId: 'box', quantity: 1 },
      { materialId: 'label', quantity: 1 },
    ],
    calculatedCost: 0,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'product-b',
    name: 'Produto B',
    salePrice: 20,
    ingredients: [],
    materials: [{ materialId: 'box', quantity: 2 }],
    calculatedCost: 0,
    createdAt: '',
    updatedAt: '',
  },
];

const item = (productId: string, quantity = 1): OrderProductItem => ({
  id: `item-${productId}`,
  productId,
  productName: productId,
  quantity,
  unitPrice: 10,
  totalPrice: 10,
  unitCost: 0,
  totalCost: 0,
});

const material = (
  materialId: string,
  quantity: number,
  source: EditableOrderMaterial['source'],
): EditableOrderMaterial => ({
  id: `${source}-${materialId}-${quantity}`,
  materialId,
  materialName: materialId,
  quantity,
  unitCost: materialId === 'box' ? 5 : 1,
  totalCost: quantity * (materialId === 'box' ? 5 : 1),
  isAutomatic: source === 'automatic',
  source,
});

test('soma materiais automáticos iguais em uma única linha', () => {
  const result = syncOrderMaterials(
    [item('product-a'), item('product-b')],
    [material('box', 1, 'automatic'), material('box', 2, 'automatic')],
    products,
    materials,
  );

  assert.deepEqual(
    result.map(({ materialId, quantity, source }) => ({ materialId, quantity, source })),
    [
      { materialId: 'box', quantity: 3, source: 'automatic' },
      { materialId: 'label', quantity: 1, source: 'automatic' },
    ],
  );
});

test('remover produto remove somente o material automático vinculado', () => {
  const result = syncOrderMaterials(
    [],
    [material('box', 1, 'automatic'), material('label', 4, 'manual')],
    products,
    materials,
  );

  assert.deepEqual(
    result.map(({ materialId, quantity, source }) => ({ materialId, quantity, source })),
    [{ materialId: 'label', quantity: 4, source: 'manual' }],
  );
});

test('soma linhas manuais repetidas sem criar duplicatas', () => {
  const result = syncOrderMaterials(
    [],
    [material('label', 2, 'manual'), material('label', 3, 'manual')],
    products,
    materials,
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].materialId, 'label');
  assert.equal(result[0].quantity, 5);
  assert.equal(result[0].totalCost, 5);
});

test('quantidades negativas são convertidas para zero e não entram no pedido', () => {
  assert.equal(parseNonNegativeQuantity(-2), 0);
  assert.equal(parseNonNegativeQuantity('-3,5'), 0);
  assert.equal(parseNonNegativeQuantity('2,5'), 2.5);

  const result = syncOrderMaterials(
    [item('product-a', -2)],
    [material('label', -4, 'manual')],
    products,
    materials,
  );

  assert.deepEqual(result, []);
});

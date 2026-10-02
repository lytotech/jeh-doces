import assert from 'node:assert/strict';
import test from 'node:test';
import type { AppSettings, Order } from '@jeh-doces/shared';
import { OrderPdfService } from './order-pdf.service';

const order: Order = {
  id: 'order-1',
  orderNumber: '#1001',
  clientName: 'Maria da Silva',
  clientPhone: '11999999999',
  clientAddress: 'Rua dos Doces, 10',
  deliveryDate: '2026-10-10T14:00:00.000Z',
  status: 'orcamento',
  items: [
    {
      id: 'item-1',
      productId: 'product-1',
      productName: 'Bolo de chocolate',
      quantity: 2,
      unitPrice: 35,
      totalPrice: 70,
      unitCost: 10,
      totalCost: 20,
    },
  ],
  materials: [],
  subtotal: 70,
  discount: 5,
  totalCharged: 65,
  estimatedCost: 20,
  estimatedProfit: 45,
  profitMarginPercent: 69.23,
  payments: [],
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
};

const settings: AppSettings = {
  storeName: 'Jeh Doces',
  storePhone: '',
  pixKey: '',
  pixKeyType: '',
  defaultProfitMargin: 30,
  currencySymbol: 'R$',
};

test('gera um PDF de orçamento válido', async () => {
  const pdf = await new OrderPdfService().generate(order, settings);

  assert.ok(pdf.length > 500);
  assert.equal(pdf.subarray(0, 5).toString('ascii'), '%PDF-');
  assert.match(pdf.subarray(-10).toString('ascii'), /%%EOF\s*$/);
});

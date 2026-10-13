import assert from 'node:assert/strict';
import test from 'node:test';
import { Order } from '../types';
import { generateWhatsAppQuoteMessage } from './whatsappExporter';

const orderWithMultipleItems = (): Order => ({
  id: 'order-1',
  orderNumber: '#001',
  clientName: 'Cliente Teste',
  deliveryDate: null,
  status: 'orcamento',
  items: [
    {
      id: 'item-1',
      productId: 'product-1',
      productName: 'Brigadeiro',
      quantity: 10,
      unitPrice: 2,
      totalPrice: 20,
      unitCost: 1,
      totalCost: 10,
    },
    {
      id: 'item-2',
      productId: 'product-2',
      productName: 'Brownie',
      quantity: 2,
      unitPrice: 8,
      totalPrice: 16,
      unitCost: 4,
      totalCost: 8,
    },
  ],
  materials: [
    {
      id: 'material-1',
      materialId: 'material-1',
      materialName: 'Caixa personalizada',
      quantity: 2,
      unitCost: 3,
      totalCost: 6,
    },
  ],
  subtotal: 36,
  discount: 0,
  totalCharged: 36,
  estimatedCost: 24,
  estimatedProfit: 12,
  profitMarginPercent: 33.33,
  payments: [],
  createdAt: '',
  updatedAt: '',
});

test('não lista materiais no orçamento do WhatsApp com vários itens', () => {
  const message = generateWhatsAppQuoteMessage(orderWithMultipleItems(), {
    storeName: 'Jeh Doces',
    storePhone: '',
    pixKey: '',
    pixKeyType: 'Chave',
    defaultProfitMargin: 0,
    currencySymbol: 'R$',
  });

  assert.match(message, /Brigadeiro/);
  assert.match(message, /Brownie/);
  assert.doesNotMatch(message, /EMBALAGENS & MATERIAIS INCLUSOS/);
  assert.doesNotMatch(message, /Caixa personalizada/);
});

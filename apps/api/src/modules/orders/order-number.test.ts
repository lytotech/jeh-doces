import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PrismaClient, type Prisma } from '@prisma/client';
import { createOrderCode, lockOrderCreation, nextOrderNumber } from './order-number';

// Use a disposable PostgreSQL database with the application migrations applied.
test(
  'códigos aleatórios preservam números antigos e resistem a exclusões e concorrência',
  {
    skip: !process.env.ORDER_NUMBER_TEST_DATABASE_URL,
  },
  async () => {
    const prisma = new PrismaClient({
      datasourceUrl: process.env.ORDER_NUMBER_TEST_DATABASE_URL,
    });
    const company = await prisma.company.create({ data: { name: 'Order number regression' } });
    const other = await prisma.company.create({ data: { name: 'Other company' } });
    const create = () =>
      prisma.$transaction(async (tx) => {
        await lockOrderCreation(tx, company.id);
        return tx.order.create({
          data: {
            companyId: company.id,
            orderNumber: await nextOrderNumber(tx, company.id),
          },
        });
      });
    try {
      assert.match((await create()).orderNumber, /^#[A-HJ-NP-Z2-9]{6}$/);
      const deleted = await create();
      assert.notEqual((await create()).orderNumber, deleted.orderNumber);
      await prisma.order.delete({ where: { id: deleted.id } });
      assert.match((await create()).orderNumber, /^#[A-HJ-NP-Z2-9]{6}$/);
      await prisma.order.createMany({
        data: [
          { companyId: company.id, orderNumber: 'CUSTOM' },
          { companyId: company.id, orderNumber: '#9999' },
          { companyId: other.id, orderNumber: '#99999' },
        ],
      });
      const orders = await Promise.all(Array.from({ length: 8 }, create));
      assert.equal(new Set(orders.map((order) => order.orderNumber)).size, 8);
      for (const order of orders) assert.match(order.orderNumber, /^#[A-HJ-NP-Z2-9]{6}$/);
      assert.equal(
        await prisma.order.count({
          where: { companyId: company.id, orderNumber: { in: ['CUSTOM', '#9999'] } },
        }),
        2,
      );
    } finally {
      await prisma.company.deleteMany({ where: { id: { in: [company.id, other.id] } } });
      await prisma.$disconnect();
    }
  },
);

test('gera código curto com alfabeto legível', () => {
  for (let i = 0; i < 100; i++) assert.match(createOrderCode(), /^#[A-HJ-NP-Z2-9]{6}$/);
});

test('gera outro código quando o candidato já existe na empresa', async () => {
  const candidates: string[] = [];
  const tx = {
    order: {
      findUnique: async (query: {
        where: { companyId_orderNumber: { companyId: string; orderNumber: string } };
      }) => {
        assert.equal(query.where.companyId_orderNumber.companyId, 'company');
        candidates.push(query.where.companyId_orderNumber.orderNumber);
        return candidates.length === 1 ? { id: 'occupied' } : null;
      },
    },
  } as unknown as Prisma.TransactionClient;
  const code = await nextOrderNumber(tx, 'company');
  assert.equal(candidates.length, 2);
  assert.equal(code, candidates[1]);
});

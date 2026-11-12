import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { lockOrderCreation, nextOrderNumber } from './order-number';

// Use a disposable PostgreSQL database with the application migrations applied.
test(
  'numeração resiste a exclusões, números personalizados e concorrência por empresa',
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
      assert.equal((await create()).orderNumber, '#1001');
      const deleted = await create();
      assert.equal((await create()).orderNumber, '#1003');
      await prisma.order.delete({ where: { id: deleted.id } });
      assert.equal((await create()).orderNumber, '#1004');
      await prisma.order.createMany({
        data: [
          { companyId: company.id, orderNumber: 'CUSTOM' },
          { companyId: company.id, orderNumber: '#9999' },
          { companyId: other.id, orderNumber: '#99999' },
        ],
      });
      const orders = await Promise.all(Array.from({ length: 8 }, create));
      assert.deepEqual(
        orders.map((order) => order.orderNumber).sort(),
        Array.from({ length: 8 }, (_, i) => `#${10000 + i}`),
      );
    } finally {
      await prisma.company.deleteMany({ where: { id: { in: [company.id, other.id] } } });
      await prisma.$disconnect();
    }
  },
);

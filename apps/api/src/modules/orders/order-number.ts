import type { Prisma } from '@prisma/client';
import { randomInt } from 'node:crypto';

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const createOrderCode = () =>
  '#' + Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join('');

// Keep allocation and insertion serialized per company, including the public
// catalog, so even a random collision cannot reach the unique constraint.
export async function lockOrderCreation(tx: Prisma.TransactionClient, companyId: string) {
  await tx.$queryRaw`SELECT id FROM companies WHERE id = ${companyId} FOR UPDATE`;
}

export async function nextOrderNumber(tx: Prisma.TransactionClient, companyId: string) {
  let code = createOrderCode();
  while (
    await tx.order.findUnique({
      where: { companyId_orderNumber: { companyId, orderNumber: code } },
      select: { id: true },
    })
  )
    code = createOrderCode();
  return code;
}

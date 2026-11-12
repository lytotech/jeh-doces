import type { Prisma } from '@prisma/client';

// Hold the company row lock until the order transaction commits. Both creation
// paths must acquire it before reading orders or allocating a number.
export async function lockOrderCreation(tx: Prisma.TransactionClient, companyId: string) {
  await tx.$queryRaw`SELECT id FROM companies WHERE id = ${companyId} FOR UPDATE`;
}

export async function nextOrderNumber(tx: Prisma.TransactionClient, companyId: string) {
  const [result] = await tx.$queryRaw<Array<{ next: string }>>`
    SELECT (GREATEST(COALESCE(MAX(
      CASE WHEN "orderNumber" ~ '^#[0-9]+$'
        THEN SUBSTRING("orderNumber" FROM 2)::numeric END
    ), 1000), 1000) + 1)::text AS next
    FROM orders WHERE "companyId" = ${companyId}
  `;
  return `#${result.next}`;
}

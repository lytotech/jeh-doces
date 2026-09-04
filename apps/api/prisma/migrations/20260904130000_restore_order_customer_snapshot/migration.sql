ALTER TABLE "orders" ADD COLUMN "clientName" TEXT;
ALTER TABLE "orders" ADD COLUMN "clientPhone" TEXT;
ALTER TABLE "orders" ADD COLUMN "clientAddress" TEXT;

UPDATE "orders" o
SET
  "clientName" = c."name",
  "clientPhone" = c."phone",
  "clientAddress" = c."address"
FROM "customers" c
WHERE o."customerId" = c."id";

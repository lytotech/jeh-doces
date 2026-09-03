CREATE TABLE "customers" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "email" TEXT,
  "address" TEXT,
  "notes" TEXT,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "companyId" TEXT NOT NULL,
  CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "customers_companyId_archivedAt_idx" ON "customers"("companyId", "archivedAt");
CREATE INDEX "customers_companyId_name_idx" ON "customers"("companyId", "name");
ALTER TABLE "customers" ADD CONSTRAINT "customers_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "orders" ADD COLUMN "customerId" TEXT;
CREATE INDEX "orders_customerId_idx" ON "orders"("customerId");
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Link legacy orders deterministically while retaining their original snapshots.
WITH candidates AS (
  SELECT DISTINCT ON ("companyId", key)
    "companyId", key, "id"
  FROM (
    SELECT "companyId", "clientName", "clientPhone", "clientAddress",
      lower(trim(coalesce(nullif("clientPhone", ''), "clientName" || '|' || coalesce("clientAddress", '')))) AS key,
      md5("companyId" || ':' || lower(trim(coalesce(nullif("clientPhone", ''), "clientName" || '|' || coalesce("clientAddress", ''))))) AS "id"
    FROM "orders"
  ) source
  ORDER BY "companyId", key, "id"
)
INSERT INTO "customers" ("id", "name", "phone", "address", "companyId", "updatedAt")
SELECT c."id", min(o."clientName"), nullif(min(o."clientPhone"), ''), nullif(min(o."clientAddress"), ''), c."companyId", CURRENT_TIMESTAMP
FROM candidates c
JOIN "orders" o ON o."companyId" = c."companyId"
  AND lower(trim(coalesce(nullif(o."clientPhone", ''), o."clientName" || '|' || coalesce(o."clientAddress", '')))) = c.key
GROUP BY c."id", c."companyId";

UPDATE "orders" o
SET "customerId" = md5(o."companyId" || ':' || lower(trim(coalesce(nullif(o."clientPhone", ''), o."clientName" || '|' || coalesce(o."clientAddress", '')))));

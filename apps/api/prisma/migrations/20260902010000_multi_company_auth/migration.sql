-- CreateEnum
CREATE TYPE "CompanyRole" AS ENUM ('owner', 'admin', 'employee');

-- CreateTable
CREATE TABLE "companies" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

INSERT INTO "companies" ("id", "name", "updatedAt")
VALUES ('legacy-jeh-doces', COALESCE((SELECT "storeName" FROM "settings" LIMIT 1), 'Jeh Doces'), CURRENT_TIMESTAMP);

ALTER TABLE "ingredients" ADD COLUMN "companyId" TEXT;
ALTER TABLE "materials" ADD COLUMN "companyId" TEXT;
ALTER TABLE "products" ADD COLUMN "companyId" TEXT;
ALTER TABLE "orders" ADD COLUMN "companyId" TEXT;
ALTER TABLE "settings" ADD COLUMN "companyId" TEXT;

UPDATE "ingredients" SET "companyId" = 'legacy-jeh-doces';
UPDATE "materials" SET "companyId" = 'legacy-jeh-doces';
UPDATE "products" SET "companyId" = 'legacy-jeh-doces';
UPDATE "orders" SET "companyId" = 'legacy-jeh-doces';
UPDATE "settings" SET "companyId" = 'legacy-jeh-doces';

ALTER TABLE "ingredients" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "materials" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "products" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "settings" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "settings" ALTER COLUMN "id" DROP DEFAULT;

DROP INDEX "orders_orderNumber_key";
CREATE UNIQUE INDEX "orders_companyId_orderNumber_key" ON "orders"("companyId", "orderNumber");
CREATE INDEX "ingredients_companyId_idx" ON "ingredients"("companyId");
CREATE INDEX "materials_companyId_idx" ON "materials"("companyId");
CREATE INDEX "products_companyId_idx" ON "products"("companyId");
CREATE INDEX "orders_companyId_idx" ON "orders"("companyId");
CREATE UNIQUE INDEX "settings_companyId_key" ON "settings"("companyId");

ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "materials" ADD CONSTRAINT "materials_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "settings" ADD CONSTRAINT "settings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "users" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "memberships" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "companyId" TEXT NOT NULL,
  "role" "CompanyRole" NOT NULL DEFAULT 'employee',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "memberships_userId_companyId_key" ON "memberships"("userId", "companyId");
CREATE INDEX "memberships_companyId_idx" ON "memberships"("companyId");
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "sessions" (
  "id" TEXT NOT NULL, "tokenHash" TEXT NOT NULL, "userId" TEXT NOT NULL,
  "activeCompanyId" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "invitations" (
  "id" TEXT NOT NULL, "tokenHash" TEXT NOT NULL, "email" TEXT NOT NULL,
  "role" "CompanyRole" NOT NULL DEFAULT 'employee', "companyId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL, "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "invitations_tokenHash_key" ON "invitations"("tokenHash");
CREATE INDEX "invitations_companyId_email_idx" ON "invitations"("companyId", "email");
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "password_reset_tokens" (
  "id" TEXT NOT NULL, "tokenHash" TEXT NOT NULL, "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL, "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

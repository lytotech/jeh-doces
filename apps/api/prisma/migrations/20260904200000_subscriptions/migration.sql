CREATE TYPE "SubscriptionPlan" AS ENUM ('basic', 'monthly', 'annual');
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'pending', 'past_due', 'canceled');

CREATE TABLE "subscriptions" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "plan" "SubscriptionPlan" NOT NULL DEFAULT 'basic',
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
  "currentPeriodEnd" TIMESTAMP(3),
  "mercadoPagoId" TEXT,
  "pendingPaymentId" TEXT,
  "pendingPlan" "SubscriptionPlan",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscriptions_companyId_key" ON "subscriptions"("companyId");
CREATE INDEX "subscriptions_status_currentPeriodEnd_idx" ON "subscriptions"("status", "currentPeriodEnd");
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "subscriptions" ("id", "companyId", "updatedAt")
SELECT 'sub-' || md5("id"), "id", CURRENT_TIMESTAMP FROM "companies";

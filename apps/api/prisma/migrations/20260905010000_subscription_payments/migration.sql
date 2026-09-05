CREATE TABLE "subscription_payments" (
  "id" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "mercadoPagoId" TEXT NOT NULL,
  "plan" "SubscriptionPlan" NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "subscription_payments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "subscription_payments_mercadoPagoId_key" ON "subscription_payments"("mercadoPagoId");
CREATE INDEX "subscription_payments_subscriptionId_createdAt_idx" ON "subscription_payments"("subscriptionId", "createdAt");
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

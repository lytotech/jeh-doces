ALTER TABLE "subscription_payments"
ADD COLUMN "refundedAt" TIMESTAMP(3),
ADD COLUMN "refundId" TEXT;

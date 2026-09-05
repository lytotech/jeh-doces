ALTER TABLE "settings"
  ADD COLUMN "automaticDeliveryReminders" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "automaticPaymentReminders" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "deliveryReminderHours" INTEGER NOT NULL DEFAULT 24,
  ADD COLUMN "paymentReminderDays" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE "automatic_reminders" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "dueAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "automatic_reminders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "automatic_reminders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "automatic_reminders_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "automatic_reminders_orderId_kind_key" ON "automatic_reminders"("orderId", "kind");
CREATE INDEX "automatic_reminders_companyId_status_dueAt_idx" ON "automatic_reminders"("companyId", "status", "dueAt");

-- CreateTable
CREATE TABLE "cash_opening_balances" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_opening_balances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cash_opening_balances_companyId_occurredAt_idx" ON "cash_opening_balances"("companyId", "occurredAt");

-- AddForeignKey
ALTER TABLE "cash_opening_balances" ADD CONSTRAINT "cash_opening_balances_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

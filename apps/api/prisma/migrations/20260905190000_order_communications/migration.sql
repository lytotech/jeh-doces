CREATE TABLE "communications" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "recipient" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "communications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "communications_companyId_createdAt_idx" ON "communications"("companyId", "createdAt");
CREATE INDEX "communications_companyId_orderId_createdAt_idx" ON "communications"("companyId", "orderId", "createdAt");
ALTER TABLE "communications" ADD CONSTRAINT "communications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "communications" ADD CONSTRAINT "communications_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

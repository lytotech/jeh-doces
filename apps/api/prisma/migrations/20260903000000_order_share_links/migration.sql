ALTER TABLE "orders" ADD COLUMN "shareToken" TEXT;
CREATE UNIQUE INDEX "orders_shareToken_key" ON "orders"("shareToken");

ALTER TABLE "orders" ADD COLUMN "publicCode" TEXT;
CREATE UNIQUE INDEX "orders_publicCode_key" ON "orders"("publicCode");

ALTER TABLE "orders" ADD COLUMN "publicSubmissionId" TEXT;
CREATE UNIQUE INDEX "orders_publicSubmissionId_key" ON "orders"("publicSubmissionId");

CREATE TABLE "material_stock_movements" (
  "id" TEXT NOT NULL,
  "materialId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "quantityDelta" DOUBLE PRECISION NOT NULL,
  "stockBefore" DOUBLE PRECISION NOT NULL,
  "stockAfter" DOUBLE PRECISION NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "material_stock_movements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "material_stock_movements_materialId_fkey"
    FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "material_stock_movements_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "material_stock_movements_companyId_materialId_createdAt_idx"
  ON "material_stock_movements"("companyId", "materialId", "createdAt");

ALTER TABLE "materials"
  ADD CONSTRAINT "materials_stockQuantity_non_negative" CHECK ("stockQuantity" >= 0);

CREATE TYPE "CatalogCategoryType" AS ENUM ('product', 'material');

CREATE TABLE "catalog_categories" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "CatalogCategoryType" NOT NULL,
  "companyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "catalog_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "catalog_categories_companyId_type_name_key" ON "catalog_categories"("companyId", "type", "name");
CREATE INDEX "catalog_categories_companyId_type_name_idx" ON "catalog_categories"("companyId", "type", "name");
ALTER TABLE "catalog_categories" ADD CONSTRAINT "catalog_categories_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "catalog_categories" ("id", "name", "type", "companyId", "updatedAt")
SELECT 'cat-product-' || md5("companyId" || ':' || "category"), trim("category"), 'product', "companyId", CURRENT_TIMESTAMP
FROM "products" WHERE trim("category") <> ''
GROUP BY "companyId", trim("category");

INSERT INTO "catalog_categories" ("id", "name", "type", "companyId", "updatedAt")
SELECT 'cat-material-' || md5("companyId" || ':' || "category"), trim("category"), 'material', "companyId", CURRENT_TIMESTAMP
FROM "materials" WHERE trim("category") <> ''
GROUP BY "companyId", trim("category");

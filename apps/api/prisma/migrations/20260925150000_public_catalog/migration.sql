ALTER TABLE "settings" ADD COLUMN "publicCatalogEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "settings" ADD COLUMN "publicCatalogSlug" TEXT;
CREATE UNIQUE INDEX "settings_publicCatalogSlug_key" ON "settings"("publicCatalogSlug");
ALTER TABLE "orders" ALTER COLUMN "deliveryDate" DROP NOT NULL;

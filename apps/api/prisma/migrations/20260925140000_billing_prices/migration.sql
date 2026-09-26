CREATE TABLE "billing_prices" (
    "id" TEXT NOT NULL,
    "monthly" DOUBLE PRECISION NOT NULL DEFAULT 19.8,
    "annual" DOUBLE PRECISION NOT NULL DEFAULT 179.8,
    CONSTRAINT "billing_prices_pkey" PRIMARY KEY ("id")
);

INSERT INTO "billing_prices" ("id", "monthly", "annual")
VALUES ('default', 19.8, 179.8);

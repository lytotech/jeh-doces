CREATE TABLE "commitments" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "companyId" TEXT NOT NULL,
  CONSTRAINT "commitments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "commitments_companyId_startsAt_idx" ON "commitments"("companyId", "startsAt");
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

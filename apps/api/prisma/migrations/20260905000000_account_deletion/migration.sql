ALTER TABLE "companies" ADD COLUMN "deletionRequestedAt" TIMESTAMP(3);
ALTER TABLE "companies" ADD COLUMN "deletionScheduledFor" TIMESTAMP(3);
ALTER TABLE "companies" ADD COLUMN "deactivatedAt" TIMESTAMP(3);
CREATE INDEX "companies_deletionScheduledFor_idx" ON "companies"("deletionScheduledFor");

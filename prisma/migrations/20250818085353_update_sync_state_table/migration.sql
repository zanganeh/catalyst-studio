-- AlterTable
ALTER TABLE "public"."SyncState" ADD COLUMN     "lastSyncedHash" TEXT,
ADD COLUMN     "syncProgress" JSONB,
ALTER COLUMN "syncStatus" DROP NOT NULL;

-- Update existing rows to ensure syncStatus is not null
UPDATE "public"."SyncState" 
SET "syncStatus" = 'pending' 
WHERE "syncStatus" IS NULL;

-- CreateIndex
CREATE INDEX "SyncState_lastSyncAt_idx" ON "public"."SyncState"("lastSyncAt");

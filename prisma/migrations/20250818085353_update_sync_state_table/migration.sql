-- AlterTable
ALTER TABLE "public"."SyncState" ADD COLUMN     "lastSyncedHash" TEXT,
ADD COLUMN     "syncProgress" JSONB,
ALTER COLUMN "syncStatus" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "SyncState_lastSyncAt_idx" ON "public"."SyncState"("lastSyncAt");

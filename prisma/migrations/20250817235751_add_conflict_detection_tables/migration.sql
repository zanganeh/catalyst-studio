-- Add conflict detection tables and fields

-- Create ConflictLog table
CREATE TABLE "conflict_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type_key" TEXT NOT NULL,
    "local_hash" TEXT NOT NULL,
    "remote_hash" TEXT NOT NULL,
    "ancestor_hash" TEXT,
    "conflict_type" TEXT NOT NULL,
    "conflict_details" TEXT NOT NULL,
    "resolution" TEXT,
    "resolved_by" TEXT,
    "resolved_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for ConflictLog
CREATE INDEX "conflict_log_type_key_created_at_idx" ON "conflict_log"("type_key", "created_at");

-- Add conflict status fields to SyncState table
ALTER TABLE "sync_state" ADD COLUMN "conflict_status" TEXT;
ALTER TABLE "sync_state" ADD COLUMN "last_conflict_at" DATETIME;
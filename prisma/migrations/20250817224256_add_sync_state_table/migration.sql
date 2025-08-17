-- CreateTable
CREATE TABLE "sync_state" (
    "type_key" TEXT NOT NULL PRIMARY KEY,
    "local_hash" TEXT NOT NULL,
    "remote_hash" TEXT,
    "last_synced_hash" TEXT,
    "sync_status" TEXT NOT NULL,
    "last_sync_at" DATETIME,
    "last_checked_at" DATETIME NOT NULL,
    "change_source" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

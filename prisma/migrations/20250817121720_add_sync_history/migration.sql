-- CreateTable
CREATE TABLE "sync_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type_key" TEXT NOT NULL,
    "version_hash" TEXT NOT NULL,
    "target_platform" TEXT NOT NULL,
    "sync_direction" TEXT NOT NULL,
    "sync_status" TEXT NOT NULL,
    "pushed_data" TEXT NOT NULL,
    "response_data" TEXT,
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "sync_metadata" TEXT,
    "deployment_id" TEXT,
    "started_at" DATETIME NOT NULL,
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sync_history_version_hash_fkey" FOREIGN KEY ("version_hash") REFERENCES "content_type_versions" ("version_hash") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sync_history_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "Deployment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "sync_history_type_key_created_at_idx" ON "sync_history"("type_key", "created_at");

-- CreateIndex
CREATE INDEX "sync_history_version_hash_idx" ON "sync_history"("version_hash");

-- CreateIndex
CREATE INDEX "sync_history_target_platform_idx" ON "sync_history"("target_platform");

-- CreateIndex
CREATE INDEX "sync_history_sync_status_idx" ON "sync_history"("sync_status");

-- CreateIndex
CREATE INDEX "sync_history_deployment_id_idx" ON "sync_history"("deployment_id");

-- CreateTable
CREATE TABLE "content_type_versions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type_key" TEXT NOT NULL,
    "version_hash" TEXT NOT NULL,
    "parent_hash" TEXT,
    "content_snapshot" TEXT NOT NULL,
    "change_source" TEXT NOT NULL,
    "author" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "content_type_versions_version_hash_key" ON "content_type_versions"("version_hash");

-- CreateIndex
CREATE INDEX "idx_type_versions" ON "content_type_versions"("type_key", "created_at");

-- CreateIndex
CREATE INDEX "idx_version_hash" ON "content_type_versions"("version_hash");

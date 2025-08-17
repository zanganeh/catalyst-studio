-- CreateTable
CREATE TABLE "version_parents" (
    "version_hash" TEXT NOT NULL,
    "parent_hash" TEXT NOT NULL,
    "parent_order" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("version_hash", "parent_hash"),
    CONSTRAINT "version_parents_version_hash_fkey" FOREIGN KEY ("version_hash") REFERENCES "content_type_versions" ("version_hash") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "version_parents_parent_hash_fkey" FOREIGN KEY ("parent_hash") REFERENCES "content_type_versions" ("version_hash") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "version_parents_version_hash_idx" ON "version_parents"("version_hash");

-- CreateIndex
CREATE INDEX "version_parents_parent_hash_idx" ON "version_parents"("parent_hash");

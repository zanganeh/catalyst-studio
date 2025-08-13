-- AlterTable
ALTER TABLE "ContentItem" ADD COLUMN "metadata" TEXT;
ALTER TABLE "ContentItem" ADD COLUMN "publishedAt" DATETIME;
ALTER TABLE "ContentItem" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE INDEX "ContentItem_websiteId_contentTypeId_idx" ON "ContentItem"("websiteId", "contentTypeId");

-- CreateIndex
CREATE INDEX "ContentItem_slug_idx" ON "ContentItem"("slug");

-- CreateIndex
CREATE INDEX "ContentItem_status_publishedAt_idx" ON "ContentItem"("status", "publishedAt");

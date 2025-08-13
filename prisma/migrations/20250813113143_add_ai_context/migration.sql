-- CreateTable
CREATE TABLE "AIContext" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "websiteId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "messages" TEXT NOT NULL,
    "metadata" TEXT,
    "summary" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AIContext_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AIContext_websiteId_sessionId_idx" ON "AIContext"("websiteId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "AIContext_websiteId_sessionId_key" ON "AIContext"("websiteId", "sessionId");

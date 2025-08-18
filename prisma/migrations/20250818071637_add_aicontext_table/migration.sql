-- CreateTable
CREATE TABLE "public"."AIContext" (
    "id" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL DEFAULT 'default',
    "context" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIContext_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIContext_websiteId_idx" ON "public"."AIContext"("websiteId");

-- CreateIndex
CREATE UNIQUE INDEX "AIContext_websiteId_sessionId_key" ON "public"."AIContext"("websiteId", "sessionId");

-- AddForeignKey
ALTER TABLE "public"."AIContext" ADD CONSTRAINT "AIContext_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "public"."Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

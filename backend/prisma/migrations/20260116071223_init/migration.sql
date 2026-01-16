-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "searchTerms" TEXT NOT NULL,
    "excludedTerms" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Mention" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brandId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL,
    "isSpam" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Mention_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Mention_url_key" ON "Mention"("url");

-- CreateIndex
CREATE INDEX "Mention_brandId_idx" ON "Mention"("brandId");

-- CreateIndex
CREATE INDEX "Mention_source_idx" ON "Mention"("source");

-- CreateIndex
CREATE INDEX "Mention_publishedAt_idx" ON "Mention"("publishedAt");

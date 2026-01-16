-- AlterTable: Add relevanceScore column to Mention
-- This score represents how many search terms matched in the mention (0 to N)
-- Higher score = more relevant post (matches more keywords)

ALTER TABLE "Mention" ADD COLUMN "relevanceScore" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex: Add index on relevanceScore for faster sorting queries
CREATE INDEX "Mention_relevanceScore_idx" ON "Mention"("relevanceScore");

-- Update existing mentions to have relevanceScore = 1 (at least one match was required to be saved)
-- Note: This is a conservative default. For accurate scores, run the backfill script.
UPDATE "Mention" SET "relevanceScore" = 1 WHERE "relevanceScore" = 0;
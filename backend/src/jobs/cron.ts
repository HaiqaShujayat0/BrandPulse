import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { fetchRedditMentionsForTerms } from '../services/redditService';
import { fetchRSSMentionsForKeywords } from '../services/rssService';
import { fetchHackerNewsMentionsForTerms } from '../services/hackerNewsService';
import { validateMention, calculateRelevanceScore } from '../utils/booleanMatcher';
import { detectSpam } from '../utils/spamDetection';

const prisma = new PrismaClient();

/**
 * Aggregates mentions for all brands from all sources
 * Can be called manually or by cron job
 */
export async function aggregateMentions(): Promise<void> {
  try {
    console.log(`[${new Date().toISOString()}] Starting mention aggregation...`);

    const brands = await prisma.brand.findMany();

    if (brands.length === 0) {
      console.log('No brands found. Skipping aggregation.');
      return;
    }

    for (const brand of brands) {
      try {
        console.log(`Processing brand: ${brand.name}`);

        const searchTerms = JSON.parse(brand.searchTerms) as string[];
        const excludedTerms = JSON.parse(brand.excludedTerms) as string[];

        if (!Array.isArray(searchTerms) || searchTerms.length === 0) {
          console.log(`No search terms for brand ${brand.name}. Skipping.`);
          continue;
        }

        // Fetch mentions from all sources
        const [redditMentions, rssMentions, hnMentions] = await Promise.all([
          fetchRedditMentionsForTerms(searchTerms),
          fetchRSSMentionsForKeywords(searchTerms),
          fetchHackerNewsMentionsForTerms(searchTerms),
        ]);

        // Combine all mentions
        const allMentions: Array<{
          title: string;
          content: string;
          url: string;
          publishedAt: Date;
          source: 'reddit' | 'rss' | 'hn';
          author?: string;
          reach?: number;
        }> = [
            ...redditMentions.map((m) => ({ ...m, source: 'reddit' as const })),
            ...rssMentions.map((m) => ({ ...m, source: 'rss' as const })),
            ...hnMentions.map((m) => ({ ...m, source: 'hn' as const })),
          ];

        let savedCount = 0;
        let duplicateCount = 0;
        let excludedCount = 0;

        // Process each mention
        for (const mention of allMentions) {
          try {
            // Boolean Logic Matcher: Check searchTerms (OR) and excludedTerms (NOT)
            const validation = validateMention(
              mention.title,
              mention.content,
              searchTerms,
              excludedTerms
            );

            if (!validation.isValid) {
              excludedCount++;
              continue;
            }

            // Check for duplicates by URL
            const existing = await prisma.mention.findUnique({
              where: { url: mention.url },
            });

            if (existing) {
              duplicateCount++;
              continue;
            }

            // Spam Detection: Check for spam patterns
            const spamDetection = detectSpam(mention.title, mention.content);

            // Calculate relevance score (how many search terms match)
            const relevanceScore = calculateRelevanceScore(
              mention.title,
              mention.content,
              searchTerms
            );

            // Save new mention with author and reach data
            await prisma.mention.create({
              data: {
                brandId: brand.id,
                source: mention.source,
                title: mention.title,
                content: mention.content,
                url: mention.url,
                publishedAt: mention.publishedAt,
                isSpam: spamDetection.isSpam,
                relevanceScore: relevanceScore,
                author: mention.author || null,
                reach: mention.reach || 0,
              },
            });

            savedCount++;
          } catch (error) {
            console.error(`Error processing mention "${mention.title}":`, error);
            // Continue with next mention
          }
        }

        console.log(
          `Brand ${brand.name}: Saved ${savedCount}, Duplicates ${duplicateCount}, Excluded ${excludedCount}`
        );
      } catch (error) {
        console.error(`Error processing brand ${brand.name}:`, error);
        // Continue with next brand
      }
    }

    console.log(`[${new Date().toISOString()}] Mention aggregation completed.`);
  } catch (error) {
    console.error('Error in aggregateMentions:', error);
  }
}

/**
 * Starts the cron job that runs every 10 minutes
 */
export function startCronJob(): void {
  // Run every 10 minutes: */10 * * * *
  cron.schedule('*/10 * * * *', async () => {
    await aggregateMentions();
  });

  console.log('Cron job scheduled: Running every 10 minutes');

  // Run immediately on startup
  aggregateMentions().catch((error) => {
    console.error('Error in initial aggregation:', error);
  });
}

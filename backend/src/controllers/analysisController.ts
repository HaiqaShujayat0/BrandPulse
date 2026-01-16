import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
    generateBrandAnalysis,
    extractTopics,
    analyzeSentiment,
    batchAnalyzeSentiment
} from '../services/geminiService';

const prisma = new PrismaClient();

/**
 * GET /api/brands/:id/analysis
 * Get AI-generated analysis for a brand's recent mentions
 */
export async function getBrandAnalysis(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        // Validate brand exists
        const brand = await prisma.brand.findUnique({
            where: { id },
        });

        if (!brand) {
            res.status(404).json({ error: 'Brand not found' });
            return;
        }

        // Get recent mentions for analysis
        const mentions = await prisma.mention.findMany({
            where: { brandId: id, isSpam: false },
            orderBy: { publishedAt: 'desc' },
            take: 50,
            select: {
                title: true,
                content: true,
                sentiment: true,
            },
        });

        // Generate AI analysis
        const analysis = await generateBrandAnalysis(brand.name, mentions);

        res.json({
            brandId: id,
            brandName: brand.name,
            analysis,
            mentionCount: mentions.length,
        });
    } catch (error) {
        console.error('Error generating brand analysis:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

/**
 * GET /api/brands/:id/topics
 * Get AI-extracted trending topics for a brand
 */
export async function getBrandTopics(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        // Validate brand exists
        const brand = await prisma.brand.findUnique({
            where: { id },
        });

        if (!brand) {
            res.status(404).json({ error: 'Brand not found' });
            return;
        }

        // Get recent mentions for topic extraction
        const mentions = await prisma.mention.findMany({
            where: { brandId: id, isSpam: false },
            orderBy: { publishedAt: 'desc' },
            take: 50,
            select: {
                title: true,
                content: true,
            },
        });

        // Extract topics using Gemini
        const topics = await extractTopics(mentions);

        res.json({
            brandId: id,
            topics,
            mentionCount: mentions.length,
        });
    } catch (error) {
        console.error('Error extracting topics:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

/**
 * GET /api/brands/:id/stats
 * Get computed statistics for a brand (for dynamic stat cards)
 */
export async function getBrandStats(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        // Validate brand exists
        const brand = await prisma.brand.findUnique({
            where: { id },
        });

        if (!brand) {
            res.status(404).json({ error: 'Brand not found' });
            return;
        }

        // Get mention counts by sentiment
        const [totalMentions, positiveMentions, negativeMentions] = await Promise.all([
            prisma.mention.count({ where: { brandId: id, isSpam: false } }),
            prisma.mention.count({ where: { brandId: id, isSpam: false, sentiment: 'positive' } }),
            prisma.mention.count({ where: { brandId: id, isSpam: false, sentiment: 'negative' } }),
        ]);

        // Get total reach separately to avoid type issues
        const reachResult = await prisma.mention.aggregate({
            where: { brandId: id, isSpam: false },
            _sum: { reach: true },
        });

        const avgSentiment = totalMentions > 0
            ? Math.round((positiveMentions / totalMentions) * 100)
            : 0;

        // Crisis detection: more than 5 negative mentions or negative > 30%
        const activeCrises = negativeMentions >= 5 ||
            (totalMentions > 10 && (negativeMentions / totalMentions) > 0.3) ? 1 : 0;

        res.json({
            brandId: id,
            totalMentions,
            avgSentiment,
            activeCrises,
            reach: reachResult._sum?.reach ?? 0,
            positiveMentions,
            negativeMentions,
            neutralMentions: totalMentions - positiveMentions - negativeMentions,
        });
    } catch (error) {
        console.error('Error getting brand stats:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

/**
 * POST /api/brands/:id/analyze-sentiment
 * Analyze sentiment for all unprocessed mentions
 */
export async function analyzeBrandMentions(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        // Get mentions without sentiment
        const mentions = await prisma.mention.findMany({
            where: { brandId: id, sentiment: null },
            take: 20, // Process in batches
            select: {
                id: true,
                title: true,
                content: true,
            },
        });

        if (mentions.length === 0) {
            res.json({ message: 'No unprocessed mentions found', processed: 0 });
            return;
        }

        // Analyze each mention
        let processed = 0;
        for (const mention of mentions) {
            const text = `${mention.title} ${mention.content}`;
            const result = await analyzeSentiment(text);

            await prisma.mention.update({
                where: { id: mention.id },
                data: {
                    sentiment: result.sentiment,
                    sentimentScore: result.score,
                },
            });
            processed++;
        }

        res.json({
            message: 'Sentiment analysis complete',
            processed,
            remaining: await prisma.mention.count({ where: { brandId: id, sentiment: null } }),
        });
    } catch (error) {
        console.error('Error analyzing mentions:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

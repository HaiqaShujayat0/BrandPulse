import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLocalSentiment } from '@/lib/services/geminiService';

/**
 * POST /api/brands/[id]/reanalyze
 * Re-run local sentiment analysis on ALL existing posts
 * This uses the FREE keyword-based analysis, not Gemini API
 */
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // Get all mentions for this brand
        const mentions = await prisma.mention.findMany({
            where: { brandId: id },
            select: {
                id: true,
                title: true,
                content: true,
            },
        });

        if (mentions.length === 0) {
            return NextResponse.json({ message: 'No mentions to analyze', updated: 0 });
        }

        console.log(`Re-analyzing ${mentions.length} mentions for brand ${id}...`);

        let updated = 0;
        let positive = 0;
        let negative = 0;
        let neutral = 0;

        // Process in batches for efficiency
        const BATCH_SIZE = 50;
        for (let i = 0; i < mentions.length; i += BATCH_SIZE) {
            const batch = mentions.slice(i, i + BATCH_SIZE);

            const updates = batch.map(mention => {
                const fullText = `${mention.title} ${mention.content}`;
                const result = getLocalSentiment(fullText);

                if (result?.sentiment === 'positive') positive++;
                else if (result?.sentiment === 'negative') negative++;
                else neutral++;

                return prisma.mention.update({
                    where: { id: mention.id },
                    data: {
                        sentiment: result?.sentiment || 'neutral',
                        sentimentScore: result?.score || 0.5,
                    },
                });
            });

            await Promise.all(updates);
            updated += batch.length;
        }

        console.log(`Re-analysis complete: ${positive} positive, ${negative} negative, ${neutral} neutral`);

        return NextResponse.json({
            message: 'Re-analysis complete',
            updated,
            breakdown: { positive, negative, neutral },
        });
    } catch (error) {
        console.error('Error re-analyzing mentions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

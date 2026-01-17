import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeSentiment } from '@/lib/services/geminiService';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        const mentions = await prisma.mention.findMany({
            where: { brandId: id, sentiment: null },
            take: 20,
            select: {
                id: true,
                title: true,
                content: true,
            },
        });

        if (mentions.length === 0) {
            return NextResponse.json({ message: 'No unprocessed mentions found', processed: 0 });
        }

        let processed = 0;
        // Note: Vercel functions have short timeouts. 
        // Processing 20 items with AI might timeout on Free tier (10s limit).
        // Consider reducing take value if deployed.
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

        return NextResponse.json({
            message: 'Sentiment analysis complete',
            processed,
            remaining: await prisma.mention.count({ where: { brandId: id, sentiment: null } }),
        });
    } catch (error) {
        console.error('Error analyzing mentions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

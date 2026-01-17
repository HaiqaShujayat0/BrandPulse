import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateBrandAnalysis, getLocalSentiment } from '@/lib/services/geminiService';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        const brand = await prisma.brand.findUnique({
            where: { id },
        });

        if (!brand) {
            return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
        }

        const mentions = await prisma.mention.findMany({
            where: { brandId: id, isSpam: false },
            orderBy: { publishedAt: 'desc' },
            take: 50,
            select: {
                id: true,
                title: true,
                content: true,
                sentiment: true,
            },
        });

        // CRITICAL FIX: For mentions without sentiment, analyze on-the-fly using local keywords
        // This ensures the summary receives the FULL picture, not just AI-processed ones
        const mentionsWithSentiment = mentions.map(m => {
            if (m.sentiment) {
                return m; // Already has sentiment
            }
            // Run local sentiment analysis on-the-fly
            const fullText = `${m.title} ${m.content}`;
            const localResult = getLocalSentiment(fullText);
            return {
                ...m,
                sentiment: localResult?.sentiment || 'neutral',
            };
        });

        // Now generate analysis with the COMPLETE dataset (local + any existing AI results)
        const analysis = await generateBrandAnalysis(brand.name, mentionsWithSentiment);

        return NextResponse.json({
            brandId: id,
            brandName: brand.name,
            analysis,
            mentionCount: mentions.length,
        });
    } catch (error) {
        console.error('Error generating brand analysis:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

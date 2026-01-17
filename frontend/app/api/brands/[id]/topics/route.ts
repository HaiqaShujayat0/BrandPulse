import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTopics } from '@/lib/services/geminiService';

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
                title: true,
                content: true,
            },
        });

        const topics = await extractTopics(mentions);

        return NextResponse.json({
            brandId: id,
            topics,
            mentionCount: mentions.length,
        });
    } catch (error) {
        console.error('Error extracting topics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

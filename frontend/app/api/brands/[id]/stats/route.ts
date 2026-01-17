import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

        const [totalMentions, positiveMentions, negativeMentions] = await Promise.all([
            prisma.mention.count({ where: { brandId: id, isSpam: false } }),
            prisma.mention.count({ where: { brandId: id, isSpam: false, sentiment: 'positive' } }),
            prisma.mention.count({ where: { brandId: id, isSpam: false, sentiment: 'negative' } }),
        ]);

        const reachResult = await prisma.mention.aggregate({
            where: { brandId: id, isSpam: false },
            _sum: { reach: true },
        });

        const avgSentiment = totalMentions > 0
            ? Math.round((positiveMentions / totalMentions) * 100)
            : 0;

        const activeCrises = negativeMentions >= 5 ||
            (totalMentions > 10 && (negativeMentions / totalMentions) > 0.3) ? 1 : 0;

        return NextResponse.json({
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
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

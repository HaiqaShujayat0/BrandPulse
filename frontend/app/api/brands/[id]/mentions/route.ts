import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const searchParams = request.nextUrl.searchParams;

        const page = searchParams.get('page') || '1';
        const limit = searchParams.get('limit') || '20';
        const excludeSpam = searchParams.get('excludeSpam') || 'true';
        const source = searchParams.get('source');

        // Validate brand exists
        const brand = await prisma.brand.findUnique({
            where: { id },
        });

        if (!brand) {
            return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
        }

        // Parse pagination parameters
        const pageNumber = Math.max(1, parseInt(page, 10));
        const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10)));
        const skip = (pageNumber - 1) * limitNumber;

        // Build where clause
        const where: any = {
            brandId: id,
        };

        if (excludeSpam === 'true') {
            where.isSpam = false;
        }

        if (source && ['reddit', 'hn', 'rss'].includes(source)) {
            where.source = source;
        }

        const totalCount = await prisma.mention.count({ where });

        const mentions = await prisma.mention.findMany({
            where,
            orderBy: [
                { relevanceScore: 'desc' },
                { publishedAt: 'desc' },
            ],
            skip,
            take: limitNumber,
            select: {
                id: true,
                brandId: true,
                source: true,
                title: true,
                content: true,
                url: true,
                publishedAt: true,
                isSpam: true,
                sentiment: true,
                sentimentScore: true,
                author: true,
                reach: true,
                relevanceScore: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        const totalPages = Math.ceil(totalCount / limitNumber);
        const hasNextPage = pageNumber < totalPages;
        const hasPreviousPage = pageNumber > 1;

        return NextResponse.json({
            data: mentions,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                totalCount,
                totalPages,
                hasNextPage,
                hasPreviousPage,
            },
        });
    } catch (error) {
        console.error('Error fetching brand mentions:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

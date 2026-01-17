import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/brands
export async function GET() {
    try {
        const brands = await prisma.brand.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { mentions: true }
                }
            }
        });

        const brandsWithCounts = brands.map((brand: { id: any; name: any; searchTerms: any; excludedTerms: any; _count: { mentions: any; }; createdAt: any; updatedAt: any; }) => ({
            id: brand.id,
            name: brand.name,
            searchTerms: brand.searchTerms,
            excludedTerms: brand.excludedTerms,
            mentionCount: brand._count.mentions,
            createdAt: brand.createdAt,
            updatedAt: brand.updatedAt,
        }));

        return NextResponse.json(brandsWithCounts);
    } catch (error) {
        console.error('Error fetching brands:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/brands
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, searchTerms, excludedTerms } = body;

        // Validation
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
        }

        if (!searchTerms) {
            return NextResponse.json({ error: 'Search terms are required' }, { status: 400 });
        }

        // Parse and validate searchTerms
        let parsedSearchTerms: string[];
        try {
            parsedSearchTerms = typeof searchTerms === 'string'
                ? JSON.parse(searchTerms)
                : searchTerms;
        } catch {
            return NextResponse.json({ error: 'Invalid searchTerms format' }, { status: 400 });
        }

        if (!Array.isArray(parsedSearchTerms) || parsedSearchTerms.length === 0) {
            return NextResponse.json({ error: 'At least one search term is required' }, { status: 400 });
        }

        // Parse excludedTerms (optional)
        let parsedExcludedTerms: string[] = [];
        if (excludedTerms) {
            try {
                parsedExcludedTerms = typeof excludedTerms === 'string'
                    ? JSON.parse(excludedTerms)
                    : excludedTerms;
            } catch {
                return NextResponse.json({ error: 'Invalid excludedTerms format' }, { status: 400 });
            }
        }

        const brand = await prisma.brand.create({
            data: {
                name: name.trim(),
                searchTerms: JSON.stringify(parsedSearchTerms),
                excludedTerms: JSON.stringify(parsedExcludedTerms),
            },
        });

        return NextResponse.json(brand, { status: 201 });
    } catch (error) {
        console.error('Error creating brand:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

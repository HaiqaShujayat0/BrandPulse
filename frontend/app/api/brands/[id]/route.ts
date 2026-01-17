import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/brands/[id] - Get a single brand
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        const brand = await prisma.brand.findUnique({
            where: { id },
            include: {
                _count: { select: { mentions: true } }
            }
        });

        if (!brand) {
            return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
        }

        return NextResponse.json({
            ...brand,
            mentionCount: brand._count.mentions
        });
    } catch (error) {
        console.error('Error fetching brand:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/brands/[id] - Update a brand
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();

        const { name, searchTerms, excludedTerms } = body;

        // Validate input
        if (!name || !searchTerms) {
            return NextResponse.json(
                { error: 'Name and search terms are required' },
                { status: 400 }
            );
        }

        const updatedBrand = await prisma.brand.update({
            where: { id },
            data: {
                name,
                searchTerms: JSON.stringify(searchTerms),
                excludedTerms: JSON.stringify(excludedTerms || []),
            },
        });

        return NextResponse.json({
            ...updatedBrand,
            searchTerms: JSON.parse(updatedBrand.searchTerms),
            excludedTerms: JSON.parse(updatedBrand.excludedTerms),
        });
    } catch (error) {
        console.error('Error updating brand:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/brands/[id] - Delete a brand and all its mentions
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // Delete all mentions first (cascade)
        await prisma.mention.deleteMany({
            where: { brandId: id }
        });

        // Delete the brand
        await prisma.brand.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Brand deleted successfully' });
    } catch (error) {
        console.error('Error deleting brand:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

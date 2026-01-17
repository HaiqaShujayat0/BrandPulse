import { NextResponse } from 'next/server';
import { aggregateMentions } from '@/lib/services/scrapingOrchestrator';

// POST /api/scrape/[brandId]
export async function POST(
    request: Request,
    { params }: { params: { brandId: string } }
) {
    try {
        const { brandId } = params;

        // Trigger scraping in background (or await if Vercel serverless duration allows)
        // On Vercel free tier, max duration is 10s (Hobby) or 60s (Pro). 
        // We should await it to ensure it finishes before the lambda dies, 
        // but usually user wants immediate feedback. 
        // For "On-Demand", let's await it so the user sees real results.

        await aggregateMentions(brandId);

        return NextResponse.json({
            message: `Scraping completed for brand ${brandId}`,
            brandId,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error triggering scrape:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

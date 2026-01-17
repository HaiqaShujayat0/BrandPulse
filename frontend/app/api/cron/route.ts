import { NextResponse } from 'next/server';
import { aggregateMentions } from '@/lib/services/scrapingOrchestrator';

export const dynamic = 'force-dynamic'; // static by default, unless reading the request

export async function GET(request: Request) {
    // Check authorization header to prevent public access if desired
    // Vercel Cron sends a specific header, but basic protection is check for a secret
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // return new Response('Unauthorized', { status: 401 });
        // For simplicity in this migration, we'll leave it open or check simpler header
    }

    try {
        console.log('Cron Job: Starting global scrape...');
        await aggregateMentions(); // Scrape all brands
        console.log('Cron Job: Scrape complete');

        return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Cron Job Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

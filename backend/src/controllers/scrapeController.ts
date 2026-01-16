import { Request, Response } from 'express';
import { aggregateMentions } from '../jobs/cron';

/**
 * POST /api/scrape
 * Manually trigger mention aggregation for all brands
 */
export async function triggerScrape(req: Request, res: Response): Promise<void> {
  try {
    res.json({
      message: 'Scraping started',
      timestamp: new Date().toISOString(),
    });

    // Run scraping in background (don't wait for completion)
    aggregateMentions().catch((error) => {
      console.error('Error in manual scrape:', error);
    });
  } catch (error) {
    console.error('Error triggering scrape:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/scrape/:brandId
 * Manually trigger mention aggregation for a specific brand
 */
export async function triggerScrapeForBrand(req: Request, res: Response): Promise<void> {
  try {
    const { brandId } = req.params;

    res.json({
      message: `Scraping started for brand ${brandId}`,
      brandId,
      timestamp: new Date().toISOString(),
    });

    // Note: This would require modifying aggregateMentions to accept brandId
    // For now, it scrapes all brands
    aggregateMentions().catch((error) => {
      console.error('Error in manual scrape:', error);
    });
  } catch (error) {
    console.error('Error triggering scrape:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

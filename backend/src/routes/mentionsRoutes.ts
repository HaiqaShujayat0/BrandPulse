import { Router } from 'express';
import { getBrandMentions } from '../controllers/mentionsController';
import { createBrand, getAllBrands } from '../controllers/brandsController';
import { triggerScrape, triggerScrapeForBrand } from '../controllers/scrapeController';
import {
    getBrandAnalysis,
    getBrandTopics,
    getBrandStats,
    analyzeBrandMentions
} from '../controllers/analysisController';

const router = Router();

/**
 * GET /api/brands
 * Get all brands with mention counts
 */
router.get('/brands', getAllBrands);

/**
 * POST /api/brands
 * Create a new brand
 */
router.post('/brands', createBrand);

/**
 * POST /api/scrape
 * Manually trigger scraping for all brands
 */
router.post('/scrape', triggerScrape);

/**
 * POST /api/scrape/:brandId
 * Manually trigger scraping for a specific brand
 */
router.post('/scrape/:brandId', triggerScrapeForBrand);

/**
 * GET /api/brands/:id/mentions
 * Get mentions for a specific brand
 */
router.get('/brands/:id/mentions', getBrandMentions);

/**
 * GET /api/brands/:id/analysis
 * Get AI-generated analysis for a brand
 */
router.get('/brands/:id/analysis', getBrandAnalysis);

/**
 * GET /api/brands/:id/topics
 * Get AI-extracted trending topics
 */
router.get('/brands/:id/topics', getBrandTopics);

/**
 * GET /api/brands/:id/stats
 * Get computed statistics for stat cards
 */
router.get('/brands/:id/stats', getBrandStats);

/**
 * POST /api/brands/:id/analyze-sentiment
 * Analyze sentiment for unprocessed mentions
 */
router.post('/brands/:id/analyze-sentiment', analyzeBrandMentions);

export default router;


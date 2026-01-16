import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateBrandBody {
  name: string;
  searchTerms: string; // JSON string array
  excludedTerms: string; // JSON string array
}

/**
 * GET /api/brands
 * Get all brands with mention counts
 */
export async function getAllBrands(req: Request, res: Response): Promise<void> {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { mentions: true }
        }
      }
    });

    const brandsWithCounts = brands.map(brand => ({
      id: brand.id,
      name: brand.name,
      searchTerms: brand.searchTerms,
      excludedTerms: brand.excludedTerms,
      mentionCount: brand._count.mentions,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    }));

    res.json(brandsWithCounts);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/brands
 * Create a new brand
 */
export async function createBrand(req: Request, res: Response): Promise<void> {
  try {
    const { name, searchTerms, excludedTerms } = req.body as CreateBrandBody;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({
        error: 'Brand name is required',
      });
      return;
    }

    if (!searchTerms) {
      res.status(400).json({
        error: 'Search terms are required',
      });
      return;
    }

    // Parse and validate searchTerms
    let parsedSearchTerms: string[];
    try {
      parsedSearchTerms = typeof searchTerms === 'string'
        ? JSON.parse(searchTerms)
        : searchTerms;
    } catch {
      res.status(400).json({
        error: 'Invalid searchTerms format. Expected JSON array.',
      });
      return;
    }

    if (!Array.isArray(parsedSearchTerms) || parsedSearchTerms.length === 0) {
      res.status(400).json({
        error: 'At least one search term is required',
      });
      return;
    }

    // Parse excludedTerms (optional)
    let parsedExcludedTerms: string[] = [];
    if (excludedTerms) {
      try {
        parsedExcludedTerms = typeof excludedTerms === 'string'
          ? JSON.parse(excludedTerms)
          : excludedTerms;
      } catch {
        res.status(400).json({
          error: 'Invalid excludedTerms format. Expected JSON array.',
        });
        return;
      }

      if (!Array.isArray(parsedExcludedTerms)) {
        res.status(400).json({
          error: 'excludedTerms must be an array',
        });
        return;
      }
    }

    // Create brand
    const brand = await prisma.brand.create({
      data: {
        name: name.trim(),
        searchTerms: JSON.stringify(parsedSearchTerms),
        excludedTerms: JSON.stringify(parsedExcludedTerms),
      },
    });

    res.status(201).json(brand);
  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

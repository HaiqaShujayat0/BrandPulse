import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MentionsQueryParams {
  page?: string;
  limit?: string;
  excludeSpam?: string;
  source?: string;
}

/**
 * GET /api/brands/:id/mentions
 * Get mentions for a specific brand with pagination and filtering
 */
export async function getBrandMentions(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const {
      page = '1',
      limit = '20',
      excludeSpam = 'true',
      source,
    } = req.query as MentionsQueryParams;

    // Validate brand exists
    const brand = await prisma.brand.findUnique({
      where: { id },
    });

    if (!brand) {
      res.status(404).json({
        error: 'Brand not found',
      });
      return;
    }

    // Parse pagination parameters
    const pageNumber = Math.max(1, parseInt(page, 10));
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10))); // Max 100 per page
    const skip = (pageNumber - 1) * limitNumber;

    // Build where clause
    const where: any = {
      brandId: id,
    };

    // Filter by spam status
    if (excludeSpam === 'true') {
      where.isSpam = false;
    }

    // Filter by source
    if (source && ['reddit', 'hn', 'rss'].includes(source)) {
      where.source = source;
    }

    // Get total count for pagination
    const totalCount = await prisma.mention.count({ where });

    // Fetch mentions with pagination
    // Sort by relevance score (desc) first, then by published date (desc)
    // This ensures posts with most keyword matches appear at the top
    const mentions = await prisma.mention.findMany({
      where,
      orderBy: [
        {
          relevanceScore: 'desc',
        },
        {
          publishedAt: 'desc',
        },
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

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPreviousPage = pageNumber > 1;

    res.json({
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
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

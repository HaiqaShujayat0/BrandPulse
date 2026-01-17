export type MentionSource = "reddit" | "hn" | "rss";

export interface Mention {
  id: string;
  brandId: string;
  source: MentionSource;
  title: string;
  content: string;
  url: string;
  publishedAt: string;
  isSpam: boolean;
  // New dynamic fields
  sentiment?: "positive" | "negative" | "neutral" | null;
  sentimentScore?: number | null;
  author?: string | null;
  reach?: number;
  relevanceScore?: number; // Number of search terms matched (0 to N)
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface MentionsResponse {
  data: Mention[];
  pagination: Pagination;
}

export interface MentionsQuery {
  brandId: string;
  page?: number;
  limit?: number;
  excludeSpam?: boolean;
  source?: MentionSource | "all";
}

export interface Brand {
  id: string;
  name: string;
  searchTerms: string;
  excludedTerms: string;
  mentionCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandRequest {
  name: string;
  searchTerms: string[];
  excludedTerms: string[];
}

// New interfaces for AI features
export interface AIAnalysis {
  summary: string;
  sentimentShift: string;
  topTopics: string[];
  updatedAt: string;
}

export interface AIAnalysisResponse {
  brandId: string;
  brandName: string;
  analysis: AIAnalysis;
  mentionCount: number;
}

export interface TopicResult {
  topic: string;
  count: number;
  sentiment: "positive" | "negative" | "neutral";
}

export interface TopicsResponse {
  brandId: string;
  topics: TopicResult[];
  mentionCount: number;
}

export interface BrandStats {
  brandId: string;
  totalMentions: number;
  avgSentiment: number;
  activeCrises: number;
  reach: number;
  positiveMentions: number;
  negativeMentions: number;
  neutralMentions: number;
}

export interface CreateBrandRequest {
  name: string;
  searchTerms: string[];
  excludedTerms: string[];
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

// Mock data generator for demo/fallback
function generateMockMentions(count: number = 25): Mention[] {
  const sources: MentionSource[] = ["reddit", "hn", "rss"];
  const mockTitles = [
    "TypeScript 5.3 Released with Performance Improvements",
    "New React Server Components Tutorial",
    "Building Scalable Backends with Express",
    "The Future of Web Development",
    "Node.js Best Practices in 2024",
    "Understanding Prisma ORM",
    "CSS Grid vs Flexbox: When to Use What",
    "API Design Patterns for Modern Apps",
    "Database Optimization Techniques",
    "Security Best Practices for Node.js",
  ];

  const now = Date.now();
  const mentions: Mention[] = [];

  for (let i = 0; i < count; i++) {
    const source = sources[Math.floor(Math.random() * sources.length)];
    const hoursAgo = Math.floor(Math.random() * 48);
    const publishedAt = new Date(now - hoursAgo * 60 * 60 * 1000);

    mentions.push({
      id: `mock-${i}-${Date.now()}`,
      brandId: "demo-brand-id",
      source,
      title: mockTitles[Math.floor(Math.random() * mockTitles.length)],
      content: `This is mock content for demonstration purposes. Generated at ${new Date().toISOString()}.`,
      url: `https://example.com/post/${i}`,
      publishedAt: publishedAt.toISOString(),
      isSpam: Math.random() > 0.85,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return mentions.sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

// Custom error for rate limiting
export class RateLimitError extends Error {
  retryAfter: string;
  constructor(retryAfter: string = '15 minutes') {
    super(`Rate limited. Please try again in ${retryAfter}.`);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

// Check if error is a rate limit error
export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");

    // Special handling for rate limit errors
    if (res.status === 429) {
      let retryAfter = '15 minutes';
      try {
        const parsed = JSON.parse(text);
        retryAfter = parsed.retryAfter || retryAfter;
      } catch { }
      throw new RateLimitError(retryAfter);
    }

    throw new Error(
      `API error (${res.status} ${res.statusText}): ${text || "No body"}`
    );
  }
  return res.json() as Promise<T>;
}

export async function fetchMentions(query: MentionsQuery): Promise<MentionsResponse> {
  const { brandId, page = 1, limit = 50, excludeSpam = true, source } = query;

  const params: Record<string, string | number | boolean | undefined> = {
    page,
    limit,
    excludeSpam
  };

  if (source && source !== "all") {
    params.source = source;
  }

  const qs = buildQueryString(params);
  const url = `${BASE_URL}/api/brands/${encodeURIComponent(brandId)}/mentions${qs}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json"
    },
    cache: "no-store"
  });

  return handleResponse<MentionsResponse>(res);
}

export async function createBrand(brand: CreateBrandRequest): Promise<Brand> {
  const url = `${BASE_URL}/api/brands`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      name: brand.name,
      searchTerms: JSON.stringify(brand.searchTerms),
      excludedTerms: JSON.stringify(brand.excludedTerms),
    }),
  });

  return handleResponse<Brand>(res);
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`, {
      method: "GET",
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Fetch AI-generated analysis for a brand
 */
export async function fetchAIAnalysis(brandId: string): Promise<AIAnalysisResponse | null> {
  const url = `${BASE_URL}/api/brands/${encodeURIComponent(brandId)}/analysis`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Accept": "application/json" },
      cache: "no-store",
    });
    return handleResponse<AIAnalysisResponse>(res);
  } catch (error) {
    console.warn("Failed to fetch AI analysis:", error);
    return null;
  }
}

/**
 * Fetch AI-extracted topics for a brand
 */
export async function fetchTopics(brandId: string): Promise<TopicsResponse | null> {
  const url = `${BASE_URL}/api/brands/${encodeURIComponent(brandId)}/topics`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Accept": "application/json" },
      cache: "no-store",
    });
    return handleResponse<TopicsResponse>(res);
  } catch (error) {
    console.warn("Failed to fetch topics:", error);
    return null;
  }
}

/**
 * Fetch computed stats for a brand
 */
export async function fetchBrandStats(brandId: string): Promise<BrandStats | null> {
  const url = `${BASE_URL}/api/brands/${encodeURIComponent(brandId)}/stats`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Accept": "application/json" },
      cache: "no-store",
    });
    return handleResponse<BrandStats>(res);
  } catch (error) {
    console.warn("Failed to fetch brand stats:", error);
    return null;
  }
}

/**
 * Trigger sentiment analysis for unprocessed mentions
 */
export async function triggerSentimentAnalysis(brandId: string): Promise<{ processed: number; remaining: number } | null> {
  const url = `${BASE_URL}/api/brands/${encodeURIComponent(brandId)}/analyze-sentiment`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Accept": "application/json" },
    });
    return handleResponse<{ processed: number; remaining: number }>(res);
  } catch (error) {
    console.warn("Failed to trigger sentiment analysis:", error);
    return null;
  }
}

/**
 * Fetch all brands with mention counts
 */
export async function fetchAllBrands(): Promise<Brand[]> {
  const url = `${BASE_URL}/api/brands`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Accept": "application/json" },
      cache: "no-store",
    });
    return handleResponse<Brand[]>(res);
  } catch (error) {
    console.warn("Failed to fetch brands:", error);
    return [];
  }
}

/**
 * Trigger scraping for a specific brand
 */
export async function triggerBrandScrape(brandId: string): Promise<{ message: string; brandId: string } | null> {
  const url = `${BASE_URL}/api/scrape/${encodeURIComponent(brandId)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Accept": "application/json" },
    });
    return handleResponse<{ message: string; brandId: string }>(res);
  } catch (error) {
    console.warn("Failed to trigger brand scrape:", error);
    return null;
  }
}

/**
 * Re-analyze all existing mentions with updated keyword lists
 * Uses FREE local analysis, not Gemini API
 */
export async function reanalyzeBrandMentions(brandId: string): Promise<{ updated: number; breakdown: { positive: number; negative: number; neutral: number } } | null> {
  const url = `${BASE_URL}/api/brands/${encodeURIComponent(brandId)}/reanalyze`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Accept": "application/json" },
    });
    return handleResponse<{ updated: number; breakdown: { positive: number; negative: number; neutral: number } }>(res);
  } catch (error) {
    console.warn("Failed to reanalyze mentions:", error);
    return null;
  }
}

/**
 * Update an existing brand
 */
export async function updateBrand(
  brandId: string,
  data: { name: string; searchTerms: string[]; excludedTerms: string[] }
): Promise<Brand | null> {
  const url = `${BASE_URL}/api/brands/${encodeURIComponent(brandId)}`;

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(data),
    });
    return handleResponse<Brand>(res);
  } catch (error) {
    console.warn("Failed to update brand:", error);
    return null;
  }
}

/**
 * Delete a brand and all its mentions
 */
export async function deleteBrand(brandId: string): Promise<{ message: string } | null> {
  const url = `${BASE_URL}/api/brands/${encodeURIComponent(brandId)}`;

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: { "Accept": "application/json" },
    });
    return handleResponse<{ message: string }>(res);
  } catch (error) {
    console.warn("Failed to delete brand:", error);
    return null;
  }
}

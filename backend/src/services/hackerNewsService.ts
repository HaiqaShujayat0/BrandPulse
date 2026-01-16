import axios from 'axios';

interface HNItem {
  id: number;
  title: string;
  url?: string;
  text?: string;
  time: number;
  by: string;
}

/**
 * Fetches Hacker News stories for a given search term
 * Uses Algolia HN Search API
 * @param term - Search term to query Hacker News
 * @returns Array of HN mentions
 */
export async function fetchHackerNewsMentions(term: string): Promise<Array<{
  title: string;
  content: string;
  url: string;
  publishedAt: Date;
  author?: string;
  reach?: number;
}>> {
  try {
    const searchUrl = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(term)}&tags=story&hitsPerPage=50`;
    
    const response = await axios.get<{
      hits: Array<{
        title: string;
        url?: string;
        story_text?: string;
        created_at: string;
        objectID: string;
        author?: string;
        points?: number;
      }>;
    }>(searchUrl);

    const mentions = response.data.hits.map((hit) => {
      const url = hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
      
      return {
        title: hit.title || '',
        content: hit.story_text || '',
        url: url,
        publishedAt: new Date(hit.created_at),
        author: hit.author || undefined,
        reach: hit.points || 0, // HN points (upvotes)
      };
    });

    return mentions;
  } catch (error) {
    console.error(`Error fetching Hacker News mentions for term "${term}":`, error);
    return [];
  }
}

/**
 * Fetches Hacker News mentions for multiple terms
 * @param terms - Array of search terms
 * @returns Array of all HN mentions
 */
export async function fetchHackerNewsMentionsForTerms(terms: string[]): Promise<Array<{
  title: string;
  content: string;
  url: string;
  publishedAt: Date;
  author?: string;
  reach?: number;
}>> {
  const allMentions: Array<{
    title: string;
    content: string;
    url: string;
    publishedAt: Date;
    author?: string;
    reach?: number;
  }> = [];

  for (const term of terms) {
    try {
      const mentions = await fetchHackerNewsMentions(term);
      allMentions.push(...mentions);
    } catch (error) {
      console.error(`Error processing term "${term}":`, error);
    }
  }

  return allMentions;
}

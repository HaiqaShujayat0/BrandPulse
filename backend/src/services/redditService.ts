import axios from 'axios';

interface RedditPost {
  title: string;
  selftext: string;
  url: string;
  created_utc: number;
  permalink: string;
  author: string;
  score: number;
  ups: number;
}

interface RedditResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
  };
}

/**
 * Fetches Reddit posts for a given search term
 * @param term - Search term to query Reddit
 * @returns Array of Reddit mentions
 */
export async function fetchRedditMentions(term: string): Promise<Array<{
  title: string;
  content: string;
  url: string;
  publishedAt: Date;
  author?: string;
  reach?: number;
}>> {
  try {
    const searchUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(term)}&sort=new&limit=25`;
    
    const response = await axios.get<RedditResponse>(searchUrl, {
      headers: {
        'User-Agent': 'BrandPulse/1.0',
      },
    });

    const mentions = response.data.data.children.map((child) => {
      const post = child.data;
      return {
        title: post.title,
        content: post.selftext || '',
        url: `https://www.reddit.com${post.permalink}`,
        publishedAt: new Date(post.created_utc * 1000),
        author: post.author || undefined,
        reach: post.score || post.ups || 0, // Use score (upvotes - downvotes) or ups as fallback
      };
    });

    return mentions;
  } catch (error) {
    console.error(`Error fetching Reddit mentions for term "${term}":`, error);
    return [];
  }
}

/**
 * Fetches Reddit mentions for multiple terms with rate limiting
 * Adds a 2-second delay between requests
 * @param terms - Array of search terms
 * @returns Array of all Reddit mentions
 */
export async function fetchRedditMentionsForTerms(terms: string[]): Promise<Array<{
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

  for (let i = 0; i < terms.length; i++) {
    const term = terms[i];
    
    try {
      const mentions = await fetchRedditMentions(term);
      allMentions.push(...mentions);
    } catch (error) {
      console.error(`Error processing term "${term}":`, error);
    }

    // Add 2-second delay between requests (except for the last one)
    if (i < terms.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return allMentions;
}

import Parser from 'rss-parser';

interface RSSItem {
    title: string;
    content?: string;
    contentSnippet?: string;
    link: string;
    pubDate?: string;
    isoDate?: string;
}

interface RSSFeed {
    items: RSSItem[];
}

/**
 * Fetches RSS feed for a given keyword using Google News RSS
 * @param keyword - Keyword to search for in Google News
 * @returns Array of RSS mentions
 */
export async function fetchRSSMentions(keyword: string): Promise<Array<{
    title: string;
    content: string;
    url: string;
    publishedAt: Date;
    author?: string;
    reach?: number;
}>> {
    try {
        const parser = new Parser();
        // Google News RSS feed URL
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=en-US&gl=US&ceid=US:en`;

        const feed = await parser.parseURL(rssUrl) as RSSFeed;

        const mentions = feed.items.map((item) => {
            const publishedDate = item.isoDate
                ? new Date(item.isoDate)
                : item.pubDate
                    ? new Date(item.pubDate)
                    : new Date();

            return {
                title: item.title || '',
                content: item.contentSnippet || item.content || '',
                url: item.link || '',
                publishedAt: publishedDate,
                author: undefined, // RSS feeds typically don't include author info
                reach: 0, // RSS feeds don't have engagement metrics
            };
        });

        return mentions;
    } catch (error) {
        console.error(`Error fetching RSS mentions for keyword "${keyword}":`, error);
        return [];
    }
}

/**
 * Fetches RSS mentions for multiple keywords
 * @param keywords - Array of keywords to search
 * @returns Array of all RSS mentions
 */
export async function fetchRSSMentionsForKeywords(keywords: string[]): Promise<Array<{
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

    for (const keyword of keywords) {
        try {
            const mentions = await fetchRSSMentions(keyword);
            allMentions.push(...mentions);
        } catch (error) {
            console.error(`Error processing keyword "${keyword}":`, error);
        }
    }

    return allMentions;
}

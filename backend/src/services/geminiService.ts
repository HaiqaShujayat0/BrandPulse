import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ============================================================================
// LOCAL SENTIMENT KEYWORDS (Zero API Cost)
// ============================================================================
const POSITIVE_KEYWORDS = [
    'great', 'amazing', 'love', 'best', 'excellent', 'awesome', 'fantastic',
    'perfect', 'brilliant', 'wonderful', 'helpful', 'fast', 'fixed', 'solved',
    'recommend', 'impressed', 'easy', 'smooth', 'beautiful', 'powerful'
];

const NEGATIVE_KEYWORDS = [
    'bad', 'worst', 'hate', 'broken', 'slow', 'expensive', 'scam', 'fail',
    'terrible', 'awful', 'horrible', 'frustrating', 'annoying', 'bug', 'error',
    'crash', 'sucks', 'disappointed', 'useless', 'waste', 'problem', 'issue'
];

// ============================================================================
// INTERFACES
// ============================================================================
export interface SentimentResult {
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number; // 0-1 confidence
}

export interface AnalysisResult {
    summary: string;
    sentimentShift: string;
    topTopics: string[];
    updatedAt: string;
}

export interface TopicResult {
    topic: string;
    count: number;
    sentiment: 'positive' | 'negative' | 'neutral';
}

// ============================================================================
// LOCAL SENTIMENT ANALYSIS (Free, Instant)
// ============================================================================

/**
 * Quickly determines sentiment using keyword matching - NO API COST
 * Returns null if uncertain (mixed signals or no keywords found)
 */
export function getLocalSentiment(text: string): SentimentResult | null {
    const lower = text.toLowerCase();

    let posScore = 0;
    let negScore = 0;

    POSITIVE_KEYWORDS.forEach(word => {
        if (lower.includes(word)) posScore++;
    });

    NEGATIVE_KEYWORDS.forEach(word => {
        if (lower.includes(word)) negScore++;
    });

    // Clear positive signal
    if (posScore > 0 && negScore === 0) {
        return { sentiment: 'positive', score: Math.min(0.7 + (posScore * 0.05), 0.95) };
    }

    // Clear negative signal
    if (negScore > 0 && posScore === 0) {
        return { sentiment: 'negative', score: Math.min(0.7 + (negScore * 0.05), 0.95) };
    }

    // Mixed signals or no keywords - return null to indicate AI should analyze
    if (posScore === 0 && negScore === 0) {
        // No strong signals - mark as neutral with low confidence
        return { sentiment: 'neutral', score: 0.5 };
    }

    // Mixed signals - needs AI to determine
    return null;
}

/**
 * Checks if a mention has "high impact" keywords worth AI analysis
 */
export function isHighImpact(text: string): boolean {
    const lower = text.toLowerCase();
    return NEGATIVE_KEYWORDS.some(w => lower.includes(w)) ||
        POSITIVE_KEYWORDS.some(w => lower.includes(w));
}

// ============================================================================
// GEMINI AI ANALYSIS (Rate Limited)
// ============================================================================

/**
 * Analyze sentiment of a single mention using Gemini AI
 * Use sparingly due to rate limits
 */
export async function analyzeSentiment(text: string): Promise<SentimentResult> {
    // First try local analysis
    const localResult = getLocalSentiment(text);
    if (localResult) {
        return localResult;
    }

    // If local analysis is uncertain, use AI
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `Analyze the sentiment of the following text and respond with ONLY a JSON object in this exact format:
{"sentiment": "positive" | "negative" | "neutral", "score": 0.0 to 1.0}

Text to analyze:
"${text.slice(0, 500)}"

Respond with ONLY the JSON, no other text.`;

        const result = await model.generateContent(prompt);
        const response = result.response.text().trim();

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                sentiment: parsed.sentiment || 'neutral',
                score: typeof parsed.score === 'number' ? parsed.score : 0.5,
            };
        }

        return { sentiment: 'neutral', score: 0.5 };
    } catch (error) {
        console.error('Gemini sentiment analysis error:', error);
        return { sentiment: 'neutral', score: 0.5 };
    }
}

/**
 * OPTIMIZED: Batch analyze sentiment for multiple mentions in ONE API call
 * Reduces 600+ API calls down to ~60 calls (10 mentions per call)
 */
export async function batchAnalyzeSentiment(
    items: { id: string; text: string }[]
): Promise<Map<string, SentimentResult>> {
    const results = new Map<string, SentimentResult>();
    const needsAI: { id: string; text: string }[] = [];

    console.log(`\n📊 Processing ${items.length} mentions...`);

    // Step 1: Try local analysis first (FREE)
    for (const item of items) {
        const localResult = getLocalSentiment(item.text);
        if (localResult) {
            results.set(item.id, localResult);
        } else {
            needsAI.push(item);
        }
    }

    console.log(`✅ Local analysis: ${items.length - needsAI.length} processed`);
    console.log(`🤖 Needs AI: ${needsAI.length} items`);

    if (needsAI.length === 0) {
        return results;
    }

    // Step 2: Process remaining items with Gemini in batches of 10
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const BATCH_SIZE = 10;
    const DELAY_MS = 5000; // 5 seconds between batches (12 requests/min, under 15 RPM limit)

    for (let i = 0; i < needsAI.length; i += BATCH_SIZE) {
        const batch = needsAI.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(needsAI.length / BATCH_SIZE);

        console.log(`\n🔄 Processing batch ${batchNum}/${totalBatches} (${batch.length} items)...`);

        const prompt = `Analyze the sentiment of these ${batch.length} text snippets.
Respond ONLY with a JSON array in this exact format:
[{"id": "the_id", "sentiment": "positive" or "negative" or "neutral", "score": 0.0 to 1.0}]

Data to analyze:
${batch.map(item => `ID: ${item.id} | Text: ${item.text.slice(0, 200)}`).join('\n')}

Respond with ONLY the JSON array, no other text.`;

        try {
            const result = await model.generateContent(prompt);
            const response = result.response.text().trim();
            const jsonMatch = response.match(/\[[\s\S]*\]/);

            if (jsonMatch) {
                const parsed: { id: string; sentiment: string; score: number }[] = JSON.parse(jsonMatch[0]);
                parsed.forEach(res => {
                    if (res.id && res.sentiment) {
                        results.set(res.id, {
                            sentiment: res.sentiment as 'positive' | 'negative' | 'neutral',
                            score: typeof res.score === 'number' ? res.score : 0.5
                        });
                    }
                });
                console.log(`   ✅ Batch ${batchNum} complete: ${parsed.length} analyzed`);
            } else {
                console.log(`   ⚠️ Batch ${batchNum}: Could not parse response`);
                // Mark all as neutral on parse failure
                batch.forEach(item => {
                    results.set(item.id, { sentiment: 'neutral', score: 0.5 });
                });
            }

            // Wait between batches to respect rate limits
            if (i + BATCH_SIZE < needsAI.length) {
                console.log(`   ⏳ Waiting ${DELAY_MS / 1000}s before next batch...`);
                await new Promise(resolve => setTimeout(resolve, DELAY_MS));
            }

        } catch (error: any) {
            console.error(`   ❌ Batch ${batchNum} error:`, error.message?.slice(0, 100));

            // Check for rate limit error
            if (error.message?.includes('429')) {
                console.log(`   🛑 Rate limited! Waiting 60 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 60000));
                i -= BATCH_SIZE; // Retry this batch
            } else {
                // Mark failed batch as neutral
                batch.forEach(item => {
                    results.set(item.id, { sentiment: 'neutral', score: 0.5 });
                });
            }
        }
    }

    console.log(`\n✅ Batch processing complete: ${results.size} total analyzed`);
    return results;
}

/**
 * Generate AI analysis summary for a brand's recent mentions
 * Falls back to local data-driven analysis if Gemini API fails
 */
export async function generateBrandAnalysis(
    brandName: string,
    mentions: { title: string; content: string; sentiment?: string | null }[]
): Promise<AnalysisResult> {
    const positiveCount = mentions.filter(m => m.sentiment === 'positive').length;
    const negativeCount = mentions.filter(m => m.sentiment === 'negative').length;
    const neutralCount = mentions.filter(m => m.sentiment === 'neutral').length;
    const totalCount = mentions.length;

    // Calculate sentiment percentages
    const posPercent = totalCount > 0 ? Math.round((positiveCount / totalCount) * 100) : 0;
    const negPercent = totalCount > 0 ? Math.round((negativeCount / totalCount) * 100) : 0;

    // Generate local fallback first (in case API fails)
    const generateLocalAnalysis = (): AnalysisResult => {
        let summary: string;
        let sentimentShift: string;

        if (totalCount === 0) {
            summary = `No recent mentions found for ${brandName}.`;
            sentimentShift = 'stable';
        } else if (negPercent > 20) {
            summary = `${brandName} is experiencing elevated negative sentiment with ${negPercent}% negative mentions. Monitor for potential issues.`;
            sentimentShift = `${negPercent}% negative`;
        } else if (posPercent > 30) {
            summary = `${brandName} sentiment is positive with ${posPercent}% favorable mentions across ${totalCount} discussions.`;
            sentimentShift = `${posPercent}% positive`;
        } else {
            summary = `${brandName} has ${totalCount} recent mentions with balanced sentiment (${posPercent}% positive, ${negPercent}% negative).`;
            sentimentShift = 'stable';
        }

        // Extract simple topics from mention titles
        const topTopics = extractLocalTopics(mentions.map(m => m.title));

        return {
            summary,
            sentimentShift,
            topTopics,
            updatedAt: new Date().toISOString(),
        };
    };

    // Try Gemini API first
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const mentionSummaries = mentions.slice(0, 20).map(m =>
            `- ${m.title} (${m.sentiment || 'unknown'})`
        ).join('\n');

        const prompt = `You are analyzing brand mentions for "${brandName}". 
    
Recent mentions (${totalCount} total, ${positiveCount} positive, ${negativeCount} negative):
${mentionSummaries}

Generate a brief, professional analysis summary in this exact JSON format:
{
  "summary": "A 1-2 sentence insight about recent brand sentiment and discussions",
  "sentimentShift": "X% more positive" or "X% more negative" or "stable",
  "topTopics": ["topic1", "topic2", "topic3"]
}

Be specific and data-driven. Respond with ONLY the JSON.`;

        const result = await model.generateContent(prompt);
        const response = result.response.text().trim();

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                summary: parsed.summary || generateLocalAnalysis().summary,
                sentimentShift: parsed.sentimentShift || 'stable',
                topTopics: Array.isArray(parsed.topTopics) ? parsed.topTopics : [],
                updatedAt: new Date().toISOString(),
            };
        }

        // API returned but couldn't parse - use local fallback
        return generateLocalAnalysis();
    } catch (error) {
        console.error('Gemini analysis error, using local fallback:', error);
        // Use local analysis instead of "unavailable"
        return generateLocalAnalysis();
    }
}

/**
 * Extract simple topics from titles using word frequency (no API needed)
 */
function extractLocalTopics(titles: string[]): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
        'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
        'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of',
        'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
        'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then',
        'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more',
        'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
        'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
        'while', 'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom', 'i', 'you',
        'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their']);

    const wordCounts = new Map<string, number>();

    titles.forEach(title => {
        const words = title.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 3 && !stopWords.has(w));

        words.forEach(word => {
            wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
        });
    });

    // Get top 3 most frequent words
    return Array.from(wordCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
}

/**
 * Extract popular topics from mentions using Gemini
 */
export async function extractTopics(
    mentions: { title: string; content: string }[]
): Promise<TopicResult[]> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const texts = mentions.slice(0, 30).map(m => m.title).join('\n');

        const prompt = `Analyze these headlines and extract the top 5 most discussed topics/themes:

${texts}

Respond with ONLY a JSON array in this format:
[
  {"topic": "Topic Name", "count": estimated_mentions, "sentiment": "positive" | "negative" | "neutral"}
]

Be specific with topic names. Respond with ONLY the JSON array.`;

        const result = await model.generateContent(prompt);
        const response = result.response.text().trim();

        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return [];
    } catch (error) {
        console.error('Gemini topic extraction error:', error);
        return [];
    }
}

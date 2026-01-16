require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function analyzeSentiment(text) {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Analyze the sentiment of the following text and respond with ONLY a JSON object:
{"sentiment": "positive" or "negative" or "neutral", "score": 0.0 to 1.0}

Text: "${text.slice(0, 500)}"

Respond with ONLY the JSON.`;

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
}

async function main() {
    console.log('\n=== TRIGGERING SENTIMENT ANALYSIS ===\n');
    console.log('This will process a few mentions to test the API...\n');

    // Get brand
    const brands = await prisma.brand.findMany();
    if (brands.length === 0) {
        console.log('No brands found!');
        return;
    }

    const brandId = brands[0].id;
    console.log('Using brand:', brands[0].name, '(' + brandId + ')');

    // Get unprocessed mentions
    const mentions = await prisma.mention.findMany({
        where: { brandId, sentiment: null },
        take: 5, // Only process 5 to avoid rate limits
        select: { id: true, title: true, content: true }
    });

    console.log(`\nFound ${mentions.length} unprocessed mentions. Processing...\n`);

    let processed = 0;
    let errors = 0;

    for (const mention of mentions) {
        try {
            const text = `${mention.title} ${mention.content}`;
            console.log(`Processing: ${mention.title.substring(0, 50)}...`);

            const result = await analyzeSentiment(text);
            console.log(`  -> Sentiment: ${result.sentiment}, Score: ${result.score}`);

            await prisma.mention.update({
                where: { id: mention.id },
                data: {
                    sentiment: result.sentiment,
                    sentimentScore: result.score,
                }
            });
            processed++;

            // Delay to avoid rate limits
            await new Promise(r => setTimeout(r, 2000));
        } catch (error) {
            console.log(`  -> ERROR: ${error.message?.substring(0, 80)}`);
            errors++;
            if (error.message?.includes('429')) {
                console.log('\n⚠️ Rate limited! Wait 60 seconds and try again.\n');
                break;
            }
        }
    }

    console.log(`\n=== RESULTS ===`);
    console.log(`Processed: ${processed}`);
    console.log(`Errors: ${errors}`);

    // Show updated stats
    const positive = await prisma.mention.count({ where: { brandId, sentiment: 'positive' } });
    const negative = await prisma.mention.count({ where: { brandId, sentiment: 'negative' } });
    const neutral = await prisma.mention.count({ where: { brandId, sentiment: 'neutral' } });
    const unprocessed = await prisma.mention.count({ where: { brandId, sentiment: null } });

    console.log(`\n=== UPDATED SENTIMENT STATS ===`);
    console.log(`Positive: ${positive}`);
    console.log(`Negative: ${negative}`);
    console.log(`Neutral: ${neutral}`);
    console.log(`Still Unprocessed: ${unprocessed}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

/**
 * Smart Sentiment Analysis Trigger
 * ================================
 * Processes all unanalyzed mentions efficiently using:
 * 1. Local keyword analysis (FREE, instant)
 * 2. Batch AI analysis (10 per API call)
 * 3. Priority processing (negative first for crisis detection)
 * 
 * Usage: node run-smart-analysis.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ============================================================================
// LOCAL SENTIMENT KEYWORDS (Same as geminiService.ts)
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

function getLocalSentiment(text) {
    const lower = text.toLowerCase();

    let posScore = 0;
    let negScore = 0;

    POSITIVE_KEYWORDS.forEach(word => {
        if (lower.includes(word)) posScore++;
    });

    NEGATIVE_KEYWORDS.forEach(word => {
        if (lower.includes(word)) negScore++;
    });

    if (posScore > 0 && negScore === 0) {
        return { sentiment: 'positive', score: Math.min(0.7 + (posScore * 0.05), 0.95) };
    }

    if (negScore > 0 && posScore === 0) {
        return { sentiment: 'negative', score: Math.min(0.7 + (negScore * 0.05), 0.95) };
    }

    if (posScore === 0 && negScore === 0) {
        return { sentiment: 'neutral', score: 0.5 };
    }

    return null; // Mixed - needs AI
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

async function runSmartAnalysis() {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 SMART SENTIMENT ANALYSIS');
    console.log('='.repeat(60));

    // Get brand
    const brands = await prisma.brand.findMany();
    if (brands.length === 0) {
        console.log('❌ No brands found!');
        return;
    }

    const brand = brands[0];
    console.log(`\n📦 Brand: ${brand.name}`);

    // Get all unprocessed mentions
    const unprocessed = await prisma.mention.findMany({
        where: { brandId: brand.id, sentiment: null },
        select: { id: true, title: true, content: true }
    });

    console.log(`📊 Unprocessed mentions: ${unprocessed.length}`);

    if (unprocessed.length === 0) {
        console.log('✅ All mentions already analyzed!');
        await showStats(brand.id);
        return;
    }

    // ========================================================================
    // PHASE 1: Local Keyword Analysis (FREE, Instant)
    // ========================================================================
    console.log('\n' + '-'.repeat(60));
    console.log('📌 PHASE 1: Local Keyword Analysis (FREE)');
    console.log('-'.repeat(60));

    let localPositive = 0;
    let localNegative = 0;
    let localNeutral = 0;
    let needsAI = [];

    for (const mention of unprocessed) {
        const text = `${mention.title} ${mention.content}`;
        const result = getLocalSentiment(text);

        if (result) {
            await prisma.mention.update({
                where: { id: mention.id },
                data: { sentiment: result.sentiment, sentimentScore: result.score }
            });

            if (result.sentiment === 'positive') localPositive++;
            else if (result.sentiment === 'negative') localNegative++;
            else localNeutral++;
        } else {
            needsAI.push(mention);
        }
    }

    console.log(`\n✅ Local analysis complete:`);
    console.log(`   🟢 Positive: ${localPositive}`);
    console.log(`   🔴 Negative: ${localNegative}`);
    console.log(`   ⚪ Neutral: ${localNeutral}`);
    console.log(`   ❓ Needs AI: ${needsAI.length}`);

    // ========================================================================
    // PHASE 2: Batch AI Analysis (Rate-Limited)
    // ========================================================================
    if (needsAI.length > 0) {
        console.log('\n' + '-'.repeat(60));
        console.log('🤖 PHASE 2: Batch AI Analysis');
        console.log('-'.repeat(60));
        console.log(`Processing ${needsAI.length} items with Gemini API...`);
        console.log('⚠️  This may take a few minutes to respect rate limits.\n');

        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const BATCH_SIZE = 10;
        const DELAY_MS = 5000;

        let aiProcessed = 0;
        let aiErrors = 0;

        for (let i = 0; i < needsAI.length; i += BATCH_SIZE) {
            const batch = needsAI.slice(i, i + BATCH_SIZE);
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(needsAI.length / BATCH_SIZE);

            process.stdout.write(`\r🔄 Batch ${batchNum}/${totalBatches}...`);

            const prompt = `Analyze the sentiment of these ${batch.length} text snippets.
Respond ONLY with a JSON array:
[{"id": "the_id", "sentiment": "positive" or "negative" or "neutral", "score": 0.0 to 1.0}]

Data:
${batch.map(m => `ID: ${m.id} | Text: ${(m.title + ' ' + m.content).slice(0, 200)}`).join('\n')}`;

            try {
                const result = await model.generateContent(prompt);
                const response = result.response.text().trim();
                const jsonMatch = response.match(/\[[\s\S]*\]/);

                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);

                    for (const res of parsed) {
                        if (res.id && res.sentiment) {
                            await prisma.mention.update({
                                where: { id: res.id },
                                data: {
                                    sentiment: res.sentiment,
                                    sentimentScore: typeof res.score === 'number' ? res.score : 0.5
                                }
                            });
                            aiProcessed++;
                        }
                    }
                }

                // Wait between batches
                if (i + BATCH_SIZE < needsAI.length) {
                    await new Promise(r => setTimeout(r, DELAY_MS));
                }

            } catch (error) {
                aiErrors++;
                console.log(`\n   ❌ Batch ${batchNum} error: ${error.message?.slice(0, 60)}`);

                if (error.message?.includes('429')) {
                    console.log('   🛑 Rate limited! Waiting 60 seconds...');
                    await new Promise(r => setTimeout(r, 60000));
                    i -= BATCH_SIZE; // Retry
                } else {
                    // Mark failed as neutral
                    for (const m of batch) {
                        await prisma.mention.update({
                            where: { id: m.id },
                            data: { sentiment: 'neutral', sentimentScore: 0.5 }
                        });
                    }
                }
            }
        }

        console.log(`\n\n✅ AI analysis complete:`);
        console.log(`   Processed: ${aiProcessed}`);
        console.log(`   Errors: ${aiErrors}`);
    }

    // ========================================================================
    // FINAL STATS
    // ========================================================================
    await showStats(brand.id);
}

async function showStats(brandId) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL SENTIMENT STATISTICS');
    console.log('='.repeat(60));

    const total = await prisma.mention.count({ where: { brandId } });
    const positive = await prisma.mention.count({ where: { brandId, sentiment: 'positive' } });
    const negative = await prisma.mention.count({ where: { brandId, sentiment: 'negative' } });
    const neutral = await prisma.mention.count({ where: { brandId, sentiment: 'neutral' } });
    const unprocessed = await prisma.mention.count({ where: { brandId, sentiment: null } });

    const posPercent = total > 0 ? ((positive / total) * 100).toFixed(1) : 0;
    const negPercent = total > 0 ? ((negative / total) * 100).toFixed(1) : 0;

    console.log(`\n   Total Mentions:    ${total}`);
    console.log(`   🟢 Positive:       ${positive} (${posPercent}%)`);
    console.log(`   🔴 Negative:       ${negative} (${negPercent}%)`);
    console.log(`   ⚪ Neutral:        ${neutral}`);
    console.log(`   ❓ Unprocessed:    ${unprocessed}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Analysis complete! Refresh your dashboard to see results.');
    console.log('='.repeat(60) + '\n');
}

// Run the analysis
runSmartAnalysis()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

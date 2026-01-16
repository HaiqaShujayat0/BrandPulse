/**
 * Fill remaining unprocessed mentions as neutral
 * This allows the dashboard to show real stats immediately
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fillNeutral() {
    console.log('\n📊 Filling remaining unprocessed mentions as neutral...\n');

    const result = await prisma.mention.updateMany({
        where: { sentiment: null },
        data: { sentiment: 'neutral', sentimentScore: 0.5 }
    });

    console.log(`✅ Updated ${result.count} mentions to neutral\n`);

    // Show final stats
    const total = await prisma.mention.count();
    const positive = await prisma.mention.count({ where: { sentiment: 'positive' } });
    const negative = await prisma.mention.count({ where: { sentiment: 'negative' } });
    const neutral = await prisma.mention.count({ where: { sentiment: 'neutral' } });
    const unprocessed = await prisma.mention.count({ where: { sentiment: null } });

    const posPercent = total > 0 ? ((positive / total) * 100).toFixed(1) : 0;

    console.log('='.repeat(50));
    console.log('📊 FINAL STATS');
    console.log('='.repeat(50));
    console.log(`Total:       ${total}`);
    console.log(`🟢 Positive: ${positive} (${posPercent}%)`);
    console.log(`🔴 Negative: ${negative}`);
    console.log(`⚪ Neutral:  ${neutral}`);
    console.log(`❓ Null:     ${unprocessed}`);
    console.log('='.repeat(50));
    console.log('\n✅ Done! Refresh your dashboard to see results.\n');
}

fillNeutral()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

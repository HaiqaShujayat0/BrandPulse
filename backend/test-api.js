const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    // Get all brands
    const brands = await prisma.brand.findMany();
    console.log('\n=== BRANDS ===');
    brands.forEach(b => console.log(`ID: ${b.id}, Name: ${b.name}`));

    if (brands.length > 0) {
        const brandId = brands[0].id;
        console.log('\n=== Using Brand ID:', brandId, '===\n');

        // Get mentions with sentiment info
        const mentions = await prisma.mention.findMany({
            where: { brandId: brandId },
            take: 10,
            orderBy: { publishedAt: 'desc' },
            select: {
                id: true,
                title: true,
                sentiment: true,
                sentimentScore: true,
                reach: true,
            }
        });
        console.log('=== MENTIONS (first 10) ===');
        mentions.forEach(m => {
            console.log(`- Title: ${m.title.substring(0, 50)}...`);
            console.log(`  Sentiment: ${m.sentiment || 'NULL'}, Score: ${m.sentimentScore || 'NULL'}, Reach: ${m.reach}`);
        });

        // Count sentiment stats
        const total = await prisma.mention.count({ where: { brandId } });
        const positive = await prisma.mention.count({ where: { brandId, sentiment: 'positive' } });
        const negative = await prisma.mention.count({ where: { brandId, sentiment: 'negative' } });
        const neutral = await prisma.mention.count({ where: { brandId, sentiment: 'neutral' } });
        const unprocessed = await prisma.mention.count({ where: { brandId, sentiment: null } });

        console.log('\n=== SENTIMENT STATS ===');
        console.log(`Total: ${total}`);
        console.log(`Positive: ${positive}`);
        console.log(`Negative: ${negative}`);
        console.log(`Neutral: ${neutral}`);
        console.log(`Unprocessed (NULL): ${unprocessed}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

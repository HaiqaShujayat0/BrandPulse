/**
 * Database Cleanup Script
 * Clears all mentions to test scraping from scratch
 * 
 * Usage: node clean-database.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanDatabase() {
    console.log('\n🧹 DATABASE CLEANUP SCRIPT\n');
    console.log('='.repeat(50));

    // Show current stats
    const mentionCount = await prisma.mention.count();
    const brandCount = await prisma.brand.count();

    console.log(`Current stats:`);
    console.log(`  - Mentions: ${mentionCount}`);
    console.log(`  - Brands: ${brandCount}`);

    if (mentionCount === 0) {
        console.log('\n✅ Database is already clean!');
        return;
    }

    console.log('\n⚠️  This will DELETE all mentions (brands will be kept)\n');

    // Delete all mentions
    const result = await prisma.mention.deleteMany({});

    console.log(`\n✅ Deleted ${result.count} mentions`);
    console.log('\n📌 Brands preserved. You can now:');
    console.log('   1. Go to Dashboard');
    console.log('   2. Select a brand from dropdown');
    console.log('   3. Click "Start Monitor" to scrape fresh data');
    console.log('='.repeat(50) + '\n');
}

cleanDatabase()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

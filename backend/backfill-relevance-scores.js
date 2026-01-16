/**
 * Backfill script to calculate and update relevance scores for existing mentions
 * This should be run after adding the relevanceScore field to the database
 * 
 * Usage: ts-node backfill-relevance-scores.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Duplicate calculateRelevanceScore logic here (since we can't easily import from TS source)
function calculateRelevanceScore(title, content, searchTerms) {
    if (!Array.isArray(searchTerms) || searchTerms.length === 0) {
        return 0;
    }
    
    const fullText = `${title} ${content}`.toLowerCase();
    let matchCount = 0;
    
    searchTerms.forEach((term) => {
        const trimmedTerm = term.trim().toLowerCase();
        if (trimmedTerm.length > 0 && fullText.includes(trimmedTerm)) {
            matchCount++;
        }
    });
    
    return matchCount;
}

async function backfillRelevanceScores() {
    console.log('\n📊 Backfilling relevance scores for existing mentions...\n');

    // Get all brands
    const brands = await prisma.brand.findMany();
    
    if (brands.length === 0) {
        console.log('No brands found. Skipping backfill.');
        return;
    }

    let totalUpdated = 0;

    for (const brand of brands) {
        try {
            console.log(`Processing brand: ${brand.name}`);
            
            const searchTerms = JSON.parse(brand.searchTerms);
            const excludedTerms = JSON.parse(brand.excludedTerms);

            if (!Array.isArray(searchTerms) || searchTerms.length === 0) {
                console.log(`  ⏭️  No search terms, skipping...`);
                continue;
            }

            // Get all mentions for this brand
            const mentions = await prisma.mention.findMany({
                where: { brandId: brand.id },
                select: { id: true, title: true, content: true, relevanceScore: true },
            });

            console.log(`  📝 Found ${mentions.length} mentions`);

            let updated = 0;
            for (const mention of mentions) {
                const newScore = calculateRelevanceScore(
                    mention.title,
                    mention.content,
                    searchTerms
                );

                // Only update if score has changed
                if (newScore !== mention.relevanceScore) {
                    await prisma.mention.update({
                        where: { id: mention.id },
                        data: { relevanceScore: newScore },
                    });
                    updated++;
                }
            }

            console.log(`  ✅ Updated ${updated} mentions for ${brand.name}`);
            totalUpdated += updated;
        } catch (error) {
            console.error(`  ❌ Error processing brand ${brand.name}:`, error);
        }
    }

    console.log(`\n✨ Backfill complete! Updated ${totalUpdated} mentions total.\n`);
}

backfillRelevanceScores()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
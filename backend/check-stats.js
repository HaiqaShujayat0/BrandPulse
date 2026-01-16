const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function stats() {
    const t = await p.mention.count();
    const pos = await p.mention.count({ where: { sentiment: 'positive' } });
    const neg = await p.mention.count({ where: { sentiment: 'negative' } });
    const neu = await p.mention.count({ where: { sentiment: 'neutral' } });
    const nul = await p.mention.count({ where: { sentiment: null } });
    console.log('Total:', t);
    console.log('Positive:', pos);
    console.log('Negative:', neg);
    console.log('Neutral:', neu);
    console.log('Unprocessed (null):', nul);
    await p.$disconnect();
}

stats();

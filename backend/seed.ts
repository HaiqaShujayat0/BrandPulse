import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample brands
  const brands = [
    {
      name: 'TypeScript',
      searchTerms: ['TypeScript', 'TS', 'TSX', 'typescript'],
      excludedTerms: ['hiring', 'job', 'crypto'],
    },
    {
      name: 'React',
      searchTerms: ['React', 'ReactJS', 'React.js', 'React Native'],
      excludedTerms: ['hiring', 'job', 'crypto'],
    },
    {
      name: 'Node.js',
      searchTerms: ['Node.js', 'NodeJS', 'Node', 'Express'],
      excludedTerms: ['hiring', 'job', 'crypto'],
    },
  ];

  for (const brandData of brands) {
    const existing = await prisma.brand.findFirst({
      where: { name: brandData.name },
    });

    if (existing) {
      console.log(`⏭️  Brand "${brandData.name}" already exists, skipping...`);
      continue;
    }

    const brand = await prisma.brand.create({
      data: {
        name: brandData.name,
        searchTerms: JSON.stringify(brandData.searchTerms),
        excludedTerms: JSON.stringify(brandData.excludedTerms),
      },
    });

    console.log(`✅ Created brand: ${brand.name} (ID: ${brand.id})`);
  }

  console.log('✨ Seeding complete!');
  console.log('\n📝 Next steps:');
  console.log('1. The cron job will start scraping automatically');
  console.log('2. Or trigger manually: POST /api/scrape');
  console.log('3. View data at: http://localhost:3001/dashboard');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

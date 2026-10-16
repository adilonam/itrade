/**
 * Multiply every market's spread by 10 in the database.
 */
/* eslint-disable no-console */
import 'dotenv/config';
import { PrismaClient } from '@/lib/prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});
const prisma = new PrismaClient({ adapter });

const EXAMPLE_LIMIT = 5;

async function main() {
  const markets = await prisma.market.findMany({
    select: {
      id: true,
      symbol: true,
      type: true,
      spread: true
    }
  });

  console.log(`Loaded ${markets.length} market(s).\n`);

  let updatedCount = 0;
  let skippedCount = 0;
  const examples: {
    symbol: string;
    type: string;
    before: number;
    after: number;
  }[] = [];

  for (const market of markets) {
    const current = market.spread;

    if (current == null || Number.isNaN(current)) {
      skippedCount++;
      continue;
    }

    const next = current * 10;

    await prisma.market.update({
      where: { id: market.id },
      data: { spread: next }
    });

    updatedCount++;

    if (examples.length < EXAMPLE_LIMIT) {
      examples.push({
        symbol: market.symbol,
        type: market.type,
        before: current,
        after: next
      });
    }
  }

  console.log('--- Summary ---');
  console.log(`Updated: ${updatedCount}`);
  console.log(`Skipped: ${skippedCount}`);

  if (examples.length > 0) {
    console.log('\nExamples (before → after):');
    for (const row of examples) {
      console.log(
        `  - ${row.symbol} (${row.type}): ${row.before} → ${row.after}`
      );
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

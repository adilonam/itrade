/**
 * Upserts AppSettings from legacy .env keys (optional migration aid).
 * Only fields with non-empty env values are written; others are left unchanged in the DB.
 */
/* eslint-disable no-console */
import 'dotenv/config';
import type { Prisma } from '@/lib/prisma/generated/client';
import { PrismaClient } from '@/lib/prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';

function pick(key: string): string | undefined {
  const v = process.env[key]?.trim();
  return v && v.length > 0 ? v : undefined;
}

function parseBoolEnv(key: string): boolean | undefined {
  const raw = pick(key);
  if (raw === undefined) return undefined;
  const l = raw.toLowerCase();
  if (['true', '1', 'yes'].includes(l)) return true;
  if (['false', '0', 'no'].includes(l)) return false;
  return undefined;
}

function buildPatch(): Prisma.AppSettingsUpdateInput {
  const data: Prisma.AppSettingsUpdateInput = {};

  const openMarket = parseBoolEnv('OPEN_MARKET');
  if (openMarket !== undefined) data.openMarket = openMarket;

  return data;
}

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error('sync-app-settings-from-env: DATABASE_URL is not set.');
    process.exit(1);
  }

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
  });
  const prisma = new PrismaClient({ adapter });

  try {
    const data = buildPatch();
    const keys = Object.keys(data);

    if (keys.length === 0) {
      console.log(
        'sync-app-settings-from-env: no matching env vars set; skipping DB update.'
      );
      return;
    }

    const existing = await prisma.appSettings.findUnique({
      where: { id: 'default' }
    });

    if (existing) {
      await prisma.appSettings.update({
        where: { id: 'default' },
        data
      });
      console.log(
        `sync-app-settings-from-env: updated app_settings (${keys.join(', ')}).`
      );
    } else {
      await prisma.appSettings.create({
        data: {
          id: 'default',
          openMarket: true,
          ...((data as unknown) as Omit<
            Prisma.AppSettingsUncheckedCreateInput,
            'id' | 'openMarket'
          >)
        }
      });
      console.log(
        `sync-app-settings-from-env: created app_settings (${keys.join(', ')}).`
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

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

function parseMarginLevel(): number | undefined {
  const raw = pick('MIN_MARGIN_LEVEL');
  if (raw === undefined) return undefined;
  const n = parseFloat(raw);
  if (Number.isFinite(n) && n > 0) return Math.floor(n);
  return undefined;
}

function buildPatch(): Prisma.AppSettingsUpdateInput {
  const data: Prisma.AppSettingsUpdateInput = {};

  const appName = pick('NEXT_PUBLIC_APP_NAME');
  if (appName !== undefined) data.appName = appName;

  const googleClientId = pick('GOOGLE_CLIENT_ID');
  if (googleClientId !== undefined) data.googleClientId = googleClientId;

  const googleClientSecret = pick('GOOGLE_CLIENT_SECRET');
  if (googleClientSecret !== undefined) {
    data.googleClientSecret = googleClientSecret;
  }

  const twelvePub = pick('NEXT_PUBLIC_TWELVE_DATA_API_KEY');
  if (twelvePub !== undefined) data.twelveDataApiKeyPublic = twelvePub;

  const twelveSrv = pick('TWELVE_DATA_API_KEY');
  if (twelveSrv !== undefined) data.twelveDataApiKey = twelveSrv;

  const smtpHost = pick('SMTP_HOST');
  if (smtpHost !== undefined) data.smtpHost = smtpHost;

  const smtpPort = pick('SMTP_PORT');
  if (smtpPort !== undefined) data.smtpPort = smtpPort;

  const smtpSecure = parseBoolEnv('SMTP_SECURE');
  if (smtpSecure !== undefined) data.smtpSecure = smtpSecure;

  const smtpUser = pick('SMTP_USER');
  if (smtpUser !== undefined) data.smtpUser = smtpUser;

  const smtpPassword = pick('SMTP_PASSWORD');
  if (smtpPassword !== undefined) data.smtpPassword = smtpPassword;

  const smtpFrom = pick('SMTP_FROM_EMAIL');
  if (smtpFrom !== undefined) data.smtpFromEmail = smtpFrom;

  const minMargin = parseMarginLevel();
  if (minMargin !== undefined) data.minMarginLevel = minMargin;

  const av = pick('ALPHAVANTAGE_API_KEY');
  if (av !== undefined) data.alphaVantageApiKey = av;

  const npKey = pick('NOWPAYMENTS_API_KEY');
  if (npKey !== undefined) data.nowpaymentsApiKey = npKey;

  const npIpn = pick('NOWPAYMENTS_IPN_SECRET');
  if (npIpn !== undefined) data.nowpaymentsIpnSecret = npIpn;

  const manualWallet = pick('MANUAL_USDT_DEPOSIT_WALLET_ADDRESS');
  if (manualWallet !== undefined) {
    data.manualUsdtDepositWalletAddress = manualWallet;
  }

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
          appName: 'Trade Nova',
          openMarket: true,
          smtpPort: '587',
          smtpSecure: false,
          minMarginLevel: 100,
          ...((data as unknown) as Omit<
            Prisma.AppSettingsUncheckedCreateInput,
            | 'id'
            | 'appName'
            | 'openMarket'
            | 'smtpPort'
            | 'smtpSecure'
            | 'minMarginLevel'
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

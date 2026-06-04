import type { AppSettings } from '@/lib/prisma/generated/client';
import { prisma } from '@/lib/prisma';

let cache: AppSettings | null = null;
let cacheAt = 0;
const TTL_MS = 5000;

export function invalidateAppSettingsCache() {
  cache = null;
  cacheAt = 0;
}

export async function getAppSettingsRow(): Promise<AppSettings | null> {
  const now = Date.now();
  if (cache && now - cacheAt < TTL_MS) {
    return cache;
  }
  cache = await prisma.appSettings.findUnique({ where: { id: 'default' } });
  cacheAt = now;
  return cache;
}

/** Public API / client–safe field names (camelCase, Prisma-aligned or derived). */
export const PUBLIC_APP_SETTING_LABELS = [
  'openMarket',
  'manualUsdtDepositWalletAddress',
  'googleSignInEnabled'
] as const;

export type PublicAppSettingLabel =
  (typeof PUBLIC_APP_SETTING_LABELS)[number];

export function isPublicAppSettingLabel(
  label: string
): label is PublicAppSettingLabel {
  return (PUBLIC_APP_SETTING_LABELS as readonly string[]).includes(label);
}

export function pickPublicAppSettings(
  row: AppSettings | null
): Record<PublicAppSettingLabel, string | boolean | null> {
  const r = row;
  const googleSignInEnabled = !!(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
    process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
  return {
    openMarket: r?.openMarket ?? true,
    manualUsdtDepositWalletAddress: r?.manualUsdtDepositWalletAddress ?? null,
    googleSignInEnabled
  };
}

export function getPublicSettingValue(
  row: AppSettings | null,
  label: PublicAppSettingLabel
): string | boolean | null {
  return pickPublicAppSettings(row)[label];
}

import { getAppSettingsRow } from '@/lib/app-settings';

/** Options for @vercel/blob `put` when token is stored in AppSettings. */
export async function getBlobPutOptions(): Promise<{ token: string } | Record<string, never>> {
  const s = await getAppSettingsRow();
  const token = s?.blobReadWriteToken?.trim();
  if (token) {
    return { token };
  }
  return {};
}

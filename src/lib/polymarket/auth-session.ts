import { getAuthSession } from '@/lib/auth';

/**
 * Polymarket-facing auth helper (mirrors former `@/auth` from the clone).
 * Reuses itrade next-auth v4 sessions.
 */
export async function auth() {
  return getAuthSession();
}

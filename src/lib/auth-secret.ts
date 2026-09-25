/**
 * Resolve the NextAuth signing/encryption secret.
 * Prefer NEXTAUTH_SECRET; fall back to AUTH_SECRET (Auth.js / v5 naming).
 */
export function getAuthSecret(): string | undefined {
  return process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
}

/**
 * Role helpers for Polymarket admin checks.
 * Maps onto itrade `Role` (USER | SELLER | ADMIN | SUPERADMIN).
 */

export const UserRole = {
  user: 'USER',
  admin: 'ADMIN'
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export function isPolymarketAdmin(role: string | null | undefined): boolean {
  return role === 'ADMIN' || role === 'SUPERADMIN';
}

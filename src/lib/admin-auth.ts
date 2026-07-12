import { getAuthSession } from '@/lib/auth';
import type { Role } from '@/lib/prisma/generated/client';

export function isAdminRole(role: string | undefined | null): role is Role {
  return role === 'ADMIN' || role === 'SUPERADMIN';
}

export async function requireAdminSession() {
  const session = await getAuthSession();

  if (!session?.user) {
    return { ok: false as const, status: 401, error: 'Unauthorized' };
  }

  if (!isAdminRole(session.user.role)) {
    return {
      ok: false as const,
      status: 403,
      error: 'Forbidden - Admin role required'
    };
  }

  return { ok: true as const, session };
}

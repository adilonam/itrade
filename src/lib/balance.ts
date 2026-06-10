import type { BalanceType, Prisma, Room } from '@/lib/prisma/generated/client';

const DEFAULT_BALANCE_TYPE: BalanceType = 'REAL';

export const DEFAULT_REAL_BALANCE_AMOUNT = 0;
export const DEFAULT_DEMO_BALANCE_AMOUNT = 10_000;

export const DEFAULT_USER_BALANCE_SEED = [
  { type: 'REAL' as const, amount: DEFAULT_REAL_BALANCE_AMOUNT },
  { type: 'DEMO' as const, amount: DEFAULT_DEMO_BALANCE_AMOUNT }
] as const;

export type ResolveUserBalanceResult =
  | { ok: true; id: string; type: BalanceType }
  | { ok: false; error: 'INVALID_USER_BALANCE_ID' };

export function parseBalanceType(input: unknown): BalanceType {
  if (input === 'DEMO' || input === 'REAL') {
    return input;
  }
  return DEFAULT_BALANCE_TYPE;
}

export function getBalanceTypeForPositionRoom(): BalanceType {
  return 'REAL';
}

export async function getUserBalanceAmount(
  tx: Prisma.TransactionClient,
  userId: string,
  balanceType: BalanceType = DEFAULT_BALANCE_TYPE
): Promise<number> {
  const row = await tx.userBalance.findUnique({
    where: { userId_type: { userId, type: balanceType } },
    select: { amount: true }
  });
  return row?.amount ?? 0;
}

export async function ensureUserBalance(
  tx: Prisma.TransactionClient,
  userId: string,
  balanceType: BalanceType = DEFAULT_BALANCE_TYPE
) {
  return tx.userBalance.upsert({
    where: { userId_type: { userId, type: balanceType } },
    update: {},
    create: { userId, type: balanceType, amount: 0 }
  });
}

/**
 * Resolve which UserBalance row funds a new position.
 * Prefer explicit `userBalanceId` when provided; otherwise derive from `room`
 * (TRADING/STOCK → REAL) or explicit `balanceType`.
 */
export async function resolveUserBalanceForNewPosition(
  tx: Prisma.TransactionClient,
  userId: string,
  input: {
    userBalanceId?: string | null;
    room?: Room | null;
    balanceType?: unknown;
  }
): Promise<ResolveUserBalanceResult> {
  if (
    typeof input.userBalanceId === 'string' &&
    input.userBalanceId.length > 0
  ) {
    const row = await tx.userBalance.findFirst({
      where: { id: input.userBalanceId, userId },
      select: { id: true, type: true }
    });
    if (!row) {
      return { ok: false, error: 'INVALID_USER_BALANCE_ID' };
    }
    return { ok: true, id: row.id, type: row.type };
  }

  const explicitTypes: BalanceType[] = ['DEMO', 'REAL'];
  const hasExplicitBalanceType =
    input.balanceType !== undefined &&
    input.balanceType !== null &&
    typeof input.balanceType === 'string' &&
    explicitTypes.includes(input.balanceType as BalanceType);

  const balanceType = hasExplicitBalanceType
    ? parseBalanceType(input.balanceType)
    : getBalanceTypeForPositionRoom();

  const row = await ensureUserBalance(tx, userId, balanceType);
  return { ok: true, id: row.id, type: row.type };
}

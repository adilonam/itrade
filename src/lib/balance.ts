import type { BalanceType, Prisma } from '@/lib/prisma/generated/client';

const DEFAULT_BALANCE_TYPE: BalanceType = 'REAL';

export function parseBalanceType(input: unknown): BalanceType {
  if (input === 'DEMO' || input === 'INSTITUTIONAL' || input === 'REAL') {
    return input;
  }
  return DEFAULT_BALANCE_TYPE;
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

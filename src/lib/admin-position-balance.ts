import type {
  PositionStatus,
  Prisma,
  TransactionType
} from '@/lib/prisma/generated/client';

export type AdminPositionBalanceAdjustment = {
  amount: number;
  description: string;
  transactionType: TransactionType;
};

function isClosedStatus(status: PositionStatus): boolean {
  return status === 'CLOSED';
}

/**
 * Derive balance adjustment when an admin edits a position.
 * Balance is only affected for closed positions or status transitions involving CLOSED.
 */
export function computeAdminPositionBalanceAdjustment(input: {
  oldStatus: PositionStatus;
  newStatus: PositionStatus;
  oldPnl: number | null;
  newPnl: number | null;
  positionId: string;
  marketSymbol?: string | null;
}): AdminPositionBalanceAdjustment | null {
  const oldPnl = input.oldPnl ?? 0;
  const newPnl = input.newPnl ?? 0;
  const wasClosed = isClosedStatus(input.oldStatus);
  const isClosed = isClosedStatus(input.newStatus);
  const symbol = input.marketSymbol ?? 'Unknown';
  const shortId = input.positionId.slice(0, 8);

  if (!wasClosed && isClosed) {
    if (newPnl === 0) return null;
    return {
      amount: newPnl,
      transactionType: newPnl > 0 ? 'GAIN' : 'LOSS',
      description: `Position closed (admin) - ${symbol} [${shortId}]`
    };
  }

  if (wasClosed && !isClosed) {
    if (oldPnl === 0) return null;
    return {
      amount: -oldPnl,
      transactionType: oldPnl > 0 ? 'LOSS' : 'GAIN',
      description: `Position reopened (admin) - ${symbol} [${shortId}]`
    };
  }

  if (wasClosed && isClosed && newPnl !== oldPnl) {
    const delta = newPnl - oldPnl;
    if (delta === 0) return null;
    return {
      amount: delta,
      transactionType: delta > 0 ? 'GAIN' : 'LOSS',
      description: `Admin P&L adjustment - ${symbol} [${shortId}] (${delta > 0 ? '+' : ''}${delta.toFixed(2)})`
    };
  }

  return null;
}

export async function applyAdminPositionBalanceAdjustment(
  tx: Prisma.TransactionClient,
  userBalanceId: string,
  adjustment: AdminPositionBalanceAdjustment
) {
  if (adjustment.amount === 0) return;

  await tx.userBalance.update({
    where: { id: userBalanceId },
    data: { amount: { increment: adjustment.amount } }
  });

  await tx.transaction.create({
    data: {
      userBalanceId,
      type: adjustment.transactionType,
      absoluteAmount: Math.abs(adjustment.amount),
      description: adjustment.description
    }
  });
}

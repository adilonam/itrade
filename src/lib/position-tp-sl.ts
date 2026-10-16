import type { Position } from '@/lib/prisma/generated/client';

export type TpSlTriggerKind = 'TAKE_PROFIT' | 'STOP_LOSS';

export type TpSlTrigger = {
  kind: TpSlTriggerKind;
  closePrice: number;
  reason: string;
};

const TP_SL_REASONS: Readonly<Record<TpSlTriggerKind, string>> = {
  TAKE_PROFIT: 'Take profit reached',
  STOP_LOSS: 'Stop loss triggered'
};

function buildTrigger(kind: TpSlTriggerKind, closePrice: number): TpSlTrigger {
  return { kind, closePrice, reason: TP_SL_REASONS[kind] };
}

/**
 * Evaluate TP/SL for an open position against the current market price.
 * When triggered, the close price is the configured TP/SL level itself,
 * not the market price, so PnL is settled exactly at that level.
 */
export function getTpSlTrigger(
  position: Pick<Position, 'type' | 'takeProfit' | 'stopLoss'>,
  currentPrice: number
): TpSlTrigger | null {
  const { type, takeProfit, stopLoss } = position;

  if (type === 'BUY') {
    if (takeProfit && currentPrice >= takeProfit) {
      return buildTrigger('TAKE_PROFIT', takeProfit);
    }
    if (stopLoss && currentPrice <= stopLoss) {
      return buildTrigger('STOP_LOSS', stopLoss);
    }
  } else if (type === 'SELL') {
    if (takeProfit && currentPrice <= takeProfit) {
      return buildTrigger('TAKE_PROFIT', takeProfit);
    }
    if (stopLoss && currentPrice >= stopLoss) {
      return buildTrigger('STOP_LOSS', stopLoss);
    }
  }

  return null;
}

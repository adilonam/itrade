'use client';

import type { Transaction } from '@prisma/client';
import type { TwelveDataWebSocketPriceData } from '@/types/twelvedata';

/**
 * Client-side function to calculate dynamic P&L based on real-time websocket data
 * Only calculates dynamic P&L for PLACED transactions, returns stored P&L for others
 *
 * @param transaction - Transaction with market information and executed price
 * @param realTimeData - Real-time price data from websocket
 * @returns Calculated P&L or null if calculation fails
 */
export function calculatePnLClient(
  transaction: Transaction,
  realTimeData?: TwelveDataWebSocketPriceData
): number | null {
  // Only calculate dynamic P&L for PLACED transactions
  if (transaction.status !== 'PLACED') {
    // For non-PLACED transactions, return stored P&L or null
    return transaction.pnl;
  }

  // If no market or executed price, can't calculate P&L
  if (
    !transaction.marketId ||
    !transaction.executedPrice ||
    !transaction.quantity
  ) {
    return null;
  }

  // Use real-time price if available, otherwise can't calculate dynamic P&L
  if (!realTimeData) {
    return null;
  }

  const currentPrice = realTimeData.price;
  const executedPrice = transaction.executedPrice;
  const quantity = transaction.quantity;

  // Calculate P&L based on transaction type
  if (transaction.type === 'BUY') {
    // For BUY: P&L = (current_price - executed_price) * quantity
    return (currentPrice - executedPrice) * quantity;
  } else if (transaction.type === 'SELL') {
    // For SELL: P&L = (executed_price - current_price) * quantity
    return (executedPrice - currentPrice) * quantity;
  }

  return null;
}

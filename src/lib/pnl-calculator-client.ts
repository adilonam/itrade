'use client';

import type { Position } from '@prisma/client';
import type { TwelveDataWebSocketPriceData } from '@/types/twelvedata';

/**
 * Client-side function to calculate dynamic P&L based on real-time websocket data
 * Only calculates dynamic P&L for PLACED positions, returns stored P&L for others
 *
 * @param position - Position with market information and executed price
 * @param realTimeData - Real-time price data from websocket
 * @returns Calculated P&L or null if calculation fails
 */
export function calculatePnLClient(
  position: Position,
  realTimeData?: TwelveDataWebSocketPriceData
): number | null {
  // Only calculate dynamic P&L for PLACED positions
  if (position.status !== 'PLACED') {
    // For non-PLACED positions, return stored P&L or null
    return position.pnl;
  }

  // If no market or executed price, can't calculate P&L
  if (!position.marketId || !position.executedPrice || !position.quantity) {
    return null;
  }

  // Use real-time price if available, otherwise can't calculate dynamic P&L
  if (!realTimeData) {
    return null;
  }

  const currentPrice = realTimeData.price;
  const executedPrice = position.executedPrice;
  const quantity = position.quantity;

  // Calculate P&L based on position type
  if (position.type === 'BUY') {
    // For BUY: P&L = (current_price - executed_price) * quantity
    return (currentPrice - executedPrice) * quantity;
  } else if (position.type === 'SELL') {
    // For SELL: P&L = (executed_price - current_price) * quantity
    return (executedPrice - currentPrice) * quantity;
  }

  return null;
}

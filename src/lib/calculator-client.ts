'use client';

import type { Market, Position, User } from '@prisma/client';
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
  position: Position & {
    market: Market;
  },
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

  let lotSize = 1;
  if (position.market.type === 'FOREX') {
    lotSize = 100000;
  }

  // Calculate P&L based on position type
  if (position.type === 'BUY') {
    // For BUY: P&L = (current_price - executed_price) * quantity
    return (currentPrice - executedPrice) * quantity * lotSize;
  } else if (position.type === 'SELL') {
    // For SELL: P&L = (executed_price - current_price) * quantity
    return (executedPrice - currentPrice) * quantity * lotSize;
  }

  return null;
}

/**
 * Calculate required margin for a position based on user leverage, position price and quantity
 * @param position - Position object with user relation, quantity and executedPrice
 * @returns Required margin amount or null if calculation fails
 */
export async function calculateRequiredMargin(
  position: Position & { user: User; market: Market }
): Promise<number | null> {
  try {
    // Validate inputs
    if (!position || !position.user) {
      console.warn('Position or user is missing for margin calculation');
      return null;
    }

    // Always use executedPrice as the position price
    if (!position.executedPrice || position.executedPrice <= 0) {
      console.warn(`No valid executed price for position ${position.id}`);
      return null;
    }

    const positionPrice = position.executedPrice;

    // Calculate position value (price * quantity * lot size)
    // Standard lot size is typically 100,000 units for forex, 100 for stocks
    let lotSize = 1;
    if (position.market.type === 'FOREX') {
      lotSize = 100000;
    }
    const positionValue = positionPrice * position.quantity * lotSize;

    // Calculate required margin based on leverage
    // Required Margin = Position Value / Leverage
    const leverage = position.user.leverage || 1; // Default to 1:1 if no leverage set
    const requiredMargin = positionValue / leverage;

    console.log(`Calculated required margin for position ${position.id}:`, {
      positionValue,
      leverage,
      requiredMargin,
      positionPrice,
      quantity: position.quantity,
      lotSize
    });

    return requiredMargin;
  } catch (error) {
    console.error('Error calculating required margin:', error);
    return null;
  }
}

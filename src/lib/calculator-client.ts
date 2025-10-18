'use client';

import type { Market, Position, User, MarketType } from '@prisma/client';
import type { TwelveDataWebSocketPriceData } from '@/types/twelvedata';

/**
 * Get lot size based on market type
 * @param type - The type of market (FOREX, STOCK, etc.)
 * @returns Lot size multiplier
 */
export function getLotSize(type: MarketType): number {
  switch (type) {
    case 'FOREX':
      return 100000;
    case 'STOCKS':
      return 100;
    default:
      return 1;
  }
}

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

  const lotSize = getLotSize(position.market.type);

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
    const lotSize = getLotSize(position.market.type);
    const positionValue = positionPrice * position.quantity * lotSize;

    // Calculate required margin based on leverage
    // Required Margin = Position Value / Leverage
    // For stock room, always use leverage = 1, otherwise use user's leverage
    const leverage =
      position.market.room === 'STOCK' ? 1 : position.user.leverage || 1;
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

/**
 * Calculate lot size (quantity in lots) from a required margin amount
 * This is the inverse of calculateRequiredMargin
 * Formula: quantity = (requiredMargin * leverage) / (price * lotSize)
 *
 * @param market - Market object with type, room, and lastPrice
 * @param user - User object with leverage
 * @param requiredMargin - The margin amount to calculate lots from
 * @returns Lot size (quantity) or null if calculation fails
 */
export function calculateLotSizeFromMargin(
  market: Market,
  user: User,
  requiredMargin: number
): number | null {
  try {
    // Validate inputs
    if (!market || !user) {
      console.warn('Market or user is missing for lot size calculation');
      return null;
    }

    if (!requiredMargin || requiredMargin <= 0) {
      console.warn('Required margin must be greater than 0');
      return null;
    }

    // Use lastPrice from market as the position price
    if (!market.lastPrice || market.lastPrice <= 0) {
      console.warn(`No valid price for market ${market.symbol}`);
      return null;
    }

    const price = market.lastPrice;

    // Get lot size multiplier based on market type
    const lotSize = getLotSize(market.type);

    // Calculate leverage
    // For stock room, always use leverage = 1, otherwise use user's leverage
    const leverage = market.room === 'STOCK' ? 1 : user.leverage || 1;

    // Calculate quantity in lots
    // Formula: quantity = (requiredMargin * leverage) / (price * lotSize)
    const quantity = (requiredMargin * leverage) / (price * lotSize);

    console.log(
      `Calculated lot size from margin for market ${market.symbol}:`,
      {
        requiredMargin,
        leverage,
        price,
        lotSize,
        quantity
      }
    );

    return quantity;
  } catch (error) {
    console.error('Error calculating lot size from margin:', error);
    return null;
  }
}

'use server';

import { twelveDataService } from '@/lib/twelvedata';
import { prisma } from '@/lib/prisma';
import { Market, Position, User, MarketType } from '@prisma/client';

/**
 * Get lot size based on market type
 * @param type - The type of market (FOREX, STOCKS, etc.)
 * @returns Lot size multiplier
 */
export async function getLotSize(type: MarketType): Promise<number> {
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
 * Calculate PnL for a position based on executed price and closed price
 * This function calculates profit/loss based on the position type and actual prices.
 *
 * @param position - Position with market information, executedPrice, and closedPrice
 * @returns Calculated PnL or null if calculation fails
 */
export async function calculatePositionPnL(
  position: Position & {
    market: Market;
  }
): Promise<number | null> {
  try {
    // Only calculate PnL for BUY/SELL positions with market data
    if (!position.market || !['BUY', 'SELL'].includes(position.type)) {
      return null;
    }

    const quantity = position.quantity;

    // Use executed price from position (don't change it)
    const executedPrice = position.executedPrice;
    if (!executedPrice || executedPrice <= 0) {
      console.warn(
        `No valid executed price for position ${position.market.symbol}`
      );
      return null;
    }

    // Get current price (bid or ask based on position type)
    let currentPrice: number | null = null;

    if (position.closedPrice && position.closedPrice > 0) {
      // If position is closed, use the closed price
      currentPrice = position.closedPrice;
    } else {
      // For open positions, refresh market data and calculate current price
      const refreshedMarkets = await refreshSaveMarkets([
        position.market as Market
      ]);
      if (refreshedMarkets && refreshedMarkets.length > 0) {
        // Calculate bid/ask prices based on market spread
        const market = position.market;
        const midPrice = market.lastPrice ?? 0;
        const spread = market.spread ?? 0;
        const bidPrice = midPrice - spread / 2;
        const askPrice = midPrice + spread / 2;

        // Use ask price for BUY, bid price for SELL
        currentPrice = position.type === 'BUY' ? askPrice : bidPrice;
      } else {
        console.warn(
          `Unable to refresh market data for ${position.market.symbol}`
        );
        return null;
      }
    }
    console.log('currentPrice', currentPrice);
    console.log('executedPrice', executedPrice);
    console.log('quantity', quantity);
    console.log('type', position.type);

    // If we can't get current price, return null
    if (currentPrice === null) {
      console.warn(
        `Unable to calculate PnL for ${position.market.symbol}: missing current price`
      );
      return null;
    }

    // Calculate PnL based on position type
    let pnl: number;
    const lotSize = await getLotSize(position.market.type);

    if (position.type === 'BUY') {
      // For BUY: PnL = (current_price - executed_price) * quantity
      pnl = (currentPrice - executedPrice) * quantity * lotSize;
    } else if (position.type === 'SELL') {
      // For SELL: PnL = (executed_price - current_price) * quantity
      pnl = (executedPrice - currentPrice) * quantity * lotSize;
    } else {
      return null;
    }

    console.log(
      `Calculated PnL for ${position.type} ${position.market.symbol}: ${pnl.toFixed(2)} (Exec: ${executedPrice}, Current: ${currentPrice}, Qty: ${quantity})`
    );
    return pnl;
  } catch (error) {
    console.error('Error calculating PnL:', error);
    return null;
  }
}

/**
 * Calculate PnL for multiple positions
 * @param positions - Array of positions with market information
 * @returns Array of positions with calculated PnL
 */
export async function calculatePositionsPnL(
  positions: (Position & {
    market: {
      id: string;
      symbol: string;
      name: string;
      type: string;
      lastPrice?: number;
    } | null;
  })[]
): Promise<
  (Position & {
    market: {
      id: string;
      symbol: string;
      name: string;
      type: string;
      lastPrice?: number;
    } | null;
    calculatedPnL: number | null;
  })[]
> {
  const positionsWithPnL = await Promise.all(
    positions.map(async (position) => {
      const calculatedPnL = await calculatePositionPnL(
        position as Position & {
          market: Market;
        }
      );
      return {
        ...position,
        calculatedPnL
      };
    })
  );

  return positionsWithPnL;
}

/**
 * Refresh market data from TwelveData API and save to database
 * @param markets - Array of market objects to refresh
 * @param refreshAll - Whether to refresh all markets (default: false)
 * @returns Array of markets with refreshed data or null if refresh fails
 */
export async function refreshSaveMarkets(
  markets?: Market[],
  refreshAll: boolean = false
): Promise<Market[] | null> {
  try {
    let marketsToRefresh: Market[] = [];

    if (refreshAll) {
      // Get all visible markets
      marketsToRefresh = await prisma.market.findMany({
        where: { visible: true }
      });
    } else if (markets && markets.length > 0) {
      // Use provided markets directly
      marketsToRefresh = markets;
    } else {
      console.warn('No markets provided and refreshAll is false');
      return null;
    }

    if (marketsToRefresh.length === 0) {
      console.warn('No markets found to refresh');
      return [];
    }

    // Refresh market data using getCombinedData and save to database
    const refreshedMarkets = await Promise.all(
      marketsToRefresh.map(async (market) => {
        try {
          // const twelveDataSymbol = toTwelveDataSymbol(market);
          const marketData = await twelveDataService.getCombinedData(
            market.symbol
          );

          if ('error' in marketData) {
            console.warn(
              `Failed to refresh market ${market.symbol}:`,
              marketData.error
            );
            return market; // Return original market if API fails
          }

          // Update market with fresh data from API
          const updatedMarket = await prisma.market.update({
            where: { id: market.id },
            data: {
              lastPrice: parseFloat(marketData.current_price),
              lastChange: parseFloat(marketData.change),
              lastPercentChange: parseFloat(marketData.percent_change),
              lastPreviousClose: parseFloat(marketData.previous_close),
              updatedAt: new Date()
            }
          });

          return updatedMarket;
        } catch (error) {
          console.error(`Error refreshing market ${market.symbol}:`, error);
          return market; // Return original market if refresh fails
        }
      })
    );

    return refreshedMarkets;
  } catch (error) {
    console.error('Error refreshing markets:', error);
    return null;
  }
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
    const lotSize = await getLotSize(position.market.type);
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
 * Check if a user can open a new position based on their current positions, PnL, required margin, and leverage
 * @param position - The new position to potentially open (with user and market data)
 * @returns Object containing whether position can be opened and relevant calculations
 */
export async function couldOpenPosition(
  position: Position & { user: User; market: Market }
): Promise<{
  canOpen: boolean;
  freeMargin: number;
  totalPnL: number;
  totalRequiredMargin: number;
  newPositionRequiredMargin: number;
  leverage: number;
} | null> {
  try {
    const user = position.user;

    // Get all user positions with PLACED status from database
    const allUserPlacedPositions = await prisma.position.findMany({
      where: {
        userId: user.id,
        status: 'PLACED'
      },
      include: { market: true }
    });

    // Get all unique markets from user positions
    const marketMap = new Map();
    allUserPlacedPositions.forEach((pos) => {
      if (pos.market) {
        marketMap.set(pos.market.id, pos.market);
      }
    });

    // Add the market from the position parameter
    if (position.market) {
      marketMap.set(position.market.id, position.market);
    }

    const markets = Array.from(marketMap.values());

    // Refresh market data for all positions
    const refreshedMarkets = await refreshSaveMarkets(markets);
    if (!refreshedMarkets) {
      console.warn('Failed to refresh market data for position calculation');
      return null;
    }

    // Create a map of refreshed market data for quick lookup
    const marketDataMap = new Map();
    refreshedMarkets.forEach((market) => {
      marketDataMap.set(market.id, market);
    });

    // Calculate total PnL by manually calculating PnL for each position with refreshed data
    let totalPnL = 0;
    for (const pos of allUserPlacedPositions) {
      if (pos.market && pos.executedPrice && pos.executedPrice > 0) {
        const refreshedMarket = marketDataMap.get(pos.market.id);
        if (refreshedMarket) {
          // Calculate current price based on position type
          const midPrice = refreshedMarket.lastPrice ?? 0;
          const spread = refreshedMarket.spread ?? 0;
          const bidPrice = midPrice - spread / 2;
          const askPrice = midPrice + spread / 2;
          const currentPrice = pos.type === 'BUY' ? askPrice : bidPrice;

          // Calculate PnL
          const lotSize = await getLotSize(pos.market.type);

          let pnl = 0;
          if (pos.type === 'BUY') {
            pnl = (currentPrice - pos.executedPrice) * pos.quantity * lotSize;
          } else if (pos.type === 'SELL') {
            pnl = (pos.executedPrice - currentPrice) * pos.quantity * lotSize;
          }

          totalPnL += pnl;
        }
      }
    }

    // Calculate total required margin from all active positions (PLACED)
    const totalRequiredMargin = allUserPlacedPositions.reduce((sum, pos) => {
      return sum + (pos.requiredMargin || 0);
    }, 0);

    // Calculate free margin: balance + total PnL - total required margin
    const freeMargin = user.balance + totalPnL - totalRequiredMargin;
    console.log('freeMargin', freeMargin);
    console.log('user.balance', user.balance);
    console.log('totalPnL', totalPnL);
    console.log('totalRequiredMargin', totalRequiredMargin);

    // Calculate required margin for the new position
    const newPositionRequiredMargin = await calculateRequiredMargin(position);
    if (newPositionRequiredMargin === null) {
      console.warn(
        `Could not calculate required margin for new position ${position.id}`
      );
      return null;
    }

    // Check if user has enough free margin to open the new position
    // Also consider leverage - with higher leverage, less margin is needed

    const canOpen = freeMargin >= newPositionRequiredMargin;

    // Determine leverage based on market room
    const effectiveLeverage =
      position.market.room === 'STOCK' ? 1 : user.leverage || 1;

    console.log(`Position opening check for user ${user.id}:`, {
      canOpen,
      freeMargin,
      totalPnL,
      totalRequiredMargin,
      newPositionRequiredMargin,
      leverage: effectiveLeverage,
      marketRoom: position.market.room,
      userBalance: user.balance
    });

    return {
      canOpen,
      freeMargin,
      totalPnL,
      totalRequiredMargin,
      newPositionRequiredMargin,
      leverage: effectiveLeverage
    };
  } catch (error) {
    console.error('Error checking if position can be opened:', error);
    return null;
  }
}

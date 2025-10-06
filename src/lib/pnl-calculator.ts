'use server';

import { twelveDataService } from '@/lib/twelvedata';
import { toTwelveDataSymbol } from '@/lib/market-symbol';
import { prisma } from '@/lib/prisma';
import { Market, Position } from '@prisma/client';

/**
 * Fetch current price from TwelveData API with fallback to market lastPrice
 * @param market - Market object with symbol and type
 * @returns Current price or null if unavailable
 */
export async function fetchCurrentPrice(
  market: Market
): Promise<number | null> {
  try {
    const twelveDataSymbol = toTwelveDataSymbol(market);
    const marketData =
      await twelveDataService.getCombinedData(twelveDataSymbol);

    if ('error' in marketData) {
      console.warn(
        `Failed to get price for ${twelveDataSymbol}:`,
        marketData.error
      );
      // Fallback to market's last price
      if (market.lastPrice && market.lastPrice > 0) {
        console.log(
          `Using fallback price ${market.lastPrice} for ${twelveDataSymbol}`
        );
        return market.lastPrice;
      } else {
        console.warn(`No fallback price available for ${twelveDataSymbol}`);
        return null;
      }
    } else {
      return parseFloat(marketData.current_price);
    }
  } catch (error) {
    console.error('Error fetching current price:', error);
    return null;
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
      const refreshedMarkets = await refreshMarkets([
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

    if (position.type === 'BUY') {
      // For BUY: PnL = (current_price - executed_price) * quantity
      pnl = (currentPrice - executedPrice) * quantity;
    } else if (position.type === 'SELL') {
      // For SELL: PnL = (executed_price - current_price) * quantity
      pnl = (executedPrice - currentPrice) * quantity;
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
 * Refresh market data from TwelveData API (getCombinedData already stores data)
 * @param markets - Array of market objects to refresh
 * @param refreshAll - Whether to refresh all markets (default: false)
 * @returns Array of markets with refreshed data or null if refresh fails
 */
export async function refreshMarkets(
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

    // Refresh market data using getCombinedData (which already stores data)
    const refreshedMarkets = await Promise.all(
      marketsToRefresh.map(async (market) => {
        try {
          const twelveDataSymbol = toTwelveDataSymbol(market);
          const marketData =
            await twelveDataService.getCombinedData(twelveDataSymbol);

          if ('error' in marketData) {
            console.warn(
              `Failed to refresh market ${market.symbol}:`,
              marketData.error
            );
            return market; // Return original market if API fails
          }

          // getCombinedData already stores the data, so we just return the market
          // The data is now available in the service's cache/storage
          return market;
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

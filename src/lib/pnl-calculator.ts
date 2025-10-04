'use server';

import { twelveDataService } from '@/lib/twelvedata';
import { toTwelveDataSymbol } from '@/lib/market-symbol';
import { prisma } from '@/lib/prisma';
import { Market, Transaction } from '@prisma/client';

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
 * Calculate PnL for a transaction based on executed price and closed price
 * This function calculates profit/loss based on the transaction type and actual prices.
 *
 * @param transaction - Transaction with market information, executedPrice, and closedPrice
 * @returns Calculated PnL or null if calculation fails
 */
export async function calculateTransactionPnL(
  transaction: Transaction & {
    market: Market | null;
  }
): Promise<number | null> {
  try {
    // Only calculate PnL for BUY/SELL transactions with market data
    if (!transaction.market || !['BUY', 'SELL'].includes(transaction.type)) {
      return null;
    }

    const quantity = transaction.quantity;

    // Use executed price from transaction (don't change it)
    const executedPrice = transaction.executedPrice;
    if (!executedPrice || executedPrice <= 0) {
      console.warn(
        `No valid executed price for transaction ${transaction.market.symbol}`
      );
      return null;
    }

    // Get current price (bid or ask based on transaction type)
    let currentPrice: number | null = null;

    if (transaction.closedPrice && transaction.closedPrice > 0) {
      // If transaction is closed, use the closed price
      currentPrice = transaction.closedPrice;
    } else {
      // For open transactions, refresh market data and calculate current price
      const refreshedMarkets = await refreshMarkets([
        transaction.market as Market
      ]);
      if (refreshedMarkets && refreshedMarkets.length > 0) {
        // Calculate bid/ask prices based on market spread
        const market = transaction.market;
        const midPrice = market.lastPrice ?? 0;
        const spread = market.spread ?? 0;
        const bidPrice = midPrice - spread / 2;
        const askPrice = midPrice + spread / 2;

        // Use ask price for BUY, bid price for SELL
        currentPrice = transaction.type === 'BUY' ? askPrice : bidPrice;
      } else {
        console.warn(
          `Unable to refresh market data for ${transaction.market.symbol}`
        );
        return null;
      }
    }
    console.log('currentPrice', currentPrice);
    console.log('executedPrice', executedPrice);
    console.log('quantity', quantity);
    console.log('type', transaction.type);

    // If we can't get current price, return null
    if (currentPrice === null) {
      console.warn(
        `Unable to calculate PnL for ${transaction.market.symbol}: missing current price`
      );
      return null;
    }

    // Calculate PnL based on transaction type
    let pnl: number;

    if (transaction.type === 'BUY') {
      // For BUY: PnL = (current_price - executed_price) * quantity
      pnl = (currentPrice - executedPrice) * quantity;
    } else if (transaction.type === 'SELL') {
      // For SELL: PnL = (executed_price - current_price) * quantity
      pnl = (executedPrice - currentPrice) * quantity;
    } else {
      return null;
    }

    console.log(
      `Calculated PnL for ${transaction.type} ${transaction.market.symbol}: ${pnl.toFixed(2)} (Exec: ${executedPrice}, Current: ${currentPrice}, Qty: ${quantity})`
    );
    return pnl;
  } catch (error) {
    console.error('Error calculating PnL:', error);
    return null;
  }
}

/**
 * Calculate PnL for multiple transactions
 * @param transactions - Array of transactions with market information
 * @returns Array of transactions with calculated PnL
 */
export async function calculateTransactionsPnL(
  transactions: (Transaction & {
    market: {
      id: string;
      symbol: string;
      name: string;
      type: string;
      lastPrice?: number;
    } | null;
  })[]
): Promise<
  (Transaction & {
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
  const transactionsWithPnL = await Promise.all(
    transactions.map(async (transaction) => {
      const calculatedPnL = await calculateTransactionPnL(
        transaction as Transaction & {
          market: Market | null;
        }
      );
      return {
        ...transaction,
        calculatedPnL
      };
    })
  );

  return transactionsWithPnL;
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

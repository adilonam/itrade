import { twelveDataService } from '@/lib/twelvedata';
import { toTwelveDataSymbol } from '@/lib/market-symbol';

/**
 * Fetch current price from TwelveData API with fallback to market lastPrice
 * @param market - Market object with symbol and type
 * @returns Current price or null if unavailable
 */
export async function fetchCurrentPrice(market: any): Promise<number | null> {
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
  transaction: any
): Promise<number | null> {
  try {
    // Only calculate PnL for BUY/SELL transactions with market data
    if (!transaction.market || !['BUY', 'SELL'].includes(transaction.type)) {
      return null;
    }

    const quantity = transaction.quantity;
    let executedPrice: number | null = null;
    let closedPrice: number | null = null;

    // Get executed price
    if (transaction.executedPrice && transaction.executedPrice > 0) {
      executedPrice = transaction.executedPrice;
    } else {
      // Fallback to current market price if executed price not available
      executedPrice = await fetchCurrentPrice(transaction.market);
    }

    // Get closed price
    if (transaction.closedPrice && transaction.closedPrice > 0) {
      closedPrice = transaction.closedPrice;
    } else if (transaction.status === 'CLOSED') {
      // If transaction is closed but no closed price, try to get current price
      closedPrice = await fetchCurrentPrice(transaction.market);
    } else {
      // For open transactions, use current market price
      closedPrice = await fetchCurrentPrice(transaction.market);
    }

    // If we can't get both prices, return null
    if (executedPrice === null || closedPrice === null) {
      console.warn(
        `Unable to calculate PnL for ${transaction.market.symbol}: missing prices`
      );
      return null;
    }

    // Calculate PnL based on transaction type
    let pnl: number;

    if (transaction.type === 'BUY') {
      // For BUY: PnL = (closed_price - executed_price) * quantity
      pnl = (closedPrice - executedPrice) * quantity;
    } else if (transaction.type === 'SELL') {
      // For SELL: PnL = (executed_price - closed_price) * quantity
      pnl = (executedPrice - closedPrice) * quantity;
    } else {
      return null;
    }

    console.log(
      `Calculated PnL for ${transaction.type} ${transaction.market.symbol}: ${pnl.toFixed(2)} (Exec: ${executedPrice}, Closed: ${closedPrice}, Qty: ${quantity})`
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
  transactions: any[]
): Promise<any[]> {
  const transactionsWithPnL = await Promise.all(
    transactions.map(async (transaction) => {
      const calculatedPnL = await calculateTransactionPnL(transaction);
      return {
        ...transaction,
        calculatedPnL
      };
    })
  );

  return transactionsWithPnL;
}

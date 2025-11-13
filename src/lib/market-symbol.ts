import type { Market } from '@prisma/client';

/**
 * Convert market symbol to TwelveData API format
 * @param market - Market object with symbol and type
 * @returns TwelveData compatible symbol
 */
export function toTwelveDataSymbol(market: Market): string {
  const symbol = market.symbol;

  // For crypto markets, use the symbol as-is (e.g., BTCUSDT)
  if (market.type === 'CRYPTO') {
    return symbol;
  }

  // For forex markets, use the symbol as-is (e.g., EURUSD)
  if (market.type === 'FOREX') {
    return symbol;
  }

  // For stocks, use the symbol as-is (e.g., AAPL)
  if (market.type === 'STOCKS') {
    return symbol;
  }

  // Default fallback
  return symbol;
}

/**
 * Convert market symbol to TradingView format
 * @param market - Market object with symbol and type
 * @returns TradingView compatible symbol
 */
export function toTradingViewSymbol(market: Market): string {
  const symbol = market.symbol.replace(/\//g, '');
  return `${symbol}`;
}

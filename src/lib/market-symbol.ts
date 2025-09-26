// Map our Market objects to TradingView symbols
// - Forex: use generic FX prefix, e.g., FX:EURUSD
// - Crypto: default to BINANCE and USDT quote, e.g., BINANCE:BTCUSDT
export function toTradingViewSymbol(market: {
  symbol: string;
  type: 'forex' | 'crypto';
}): string {
  const symbol = market.symbol.replace(/\//g, '');
  if (market.type === 'forex') {
    // Remove any '/' from the symbol for TradingView format
    return `FX:${symbol}`;
  }
  // market.type === 'crypto'
  return `BINANCE:${symbol}`;
}

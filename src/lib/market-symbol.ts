import { Market } from '@/types';

// Map our Market objects to TradingView symbols
// - Forex: use generic FX prefix, e.g., FX:EURUSD
// - Crypto: default to BINANCE and USDT quote, e.g., BINANCE:BTCUSDT
export function toTradingViewSymbol(market: Market): string {
  if (market.type === 'forex') {
    return `FX:${market.symbol}`;
  }
  // market.type === 'crypto'
  return `BINANCE:${market.symbol}USDT`;
}

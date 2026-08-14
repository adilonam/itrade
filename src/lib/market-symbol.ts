import type { Market } from '@/lib/prisma/generated/client';

/**
 * App symbol → Twelve Data wire symbol overrides (see scripts/seed-markets.ts).
 */
const APP_TO_TWELVE_DATA_OVERRIDES: Readonly<Record<string, string>> = {
  US500: 'SPX',
  WTI: 'WTI/USD',
  BRENT: 'BRENT/USD'
};

/**
 * Twelve Data wire symbol → app symbol overrides.
 */
const TWELVE_DATA_TO_APP_OVERRIDES: Readonly<Record<string, string>> = {
  SPX: 'US500',
  'WTI/USD': 'WTI',
  'WTI-USD': 'WTI',
  'BRENT/USD': 'BRENT',
  'BRENT-USD': 'BRENT'
};

function normalizeAppSymbol(symbol: string): string {
  return symbol.trim().toUpperCase().replace(/[/-]/g, '');
}

function normalizeWireSymbol(symbol: string): string {
  return symbol.trim().toUpperCase().replace(/-/g, '/');
}

function isSixLetterPair(symbol: string): boolean {
  return /^[A-Z]{6}$/.test(symbol);
}

/**
 * Convert an app symbol string to Twelve Data API/WebSocket format.
 */
export function toTwelveDataSymbolString(symbol: string): string {
  const upper = symbol.trim().toUpperCase();

  const compact = upper.replace(/[/-]/g, '');
  const override = APP_TO_TWELVE_DATA_OVERRIDES[compact];
  if (override) {
    return override;
  }

  if (upper.includes('/') || upper.includes('-')) {
    return normalizeWireSymbol(upper);
  }

  if (isSixLetterPair(upper)) {
    return `${upper.slice(0, 3)}/${upper.slice(3)}`;
  }

  return upper;
}

/**
 * Convert a Market record to Twelve Data API format.
 */
export function toTwelveDataSymbol(market: Market): string {
  return toTwelveDataSymbolString(market.symbol);
}

/**
 * Map a Twelve Data wire symbol back to the app's compact symbol format.
 */
export function toAppMarketSymbol(twelveDataSymbol: string): string {
  const wire = normalizeWireSymbol(twelveDataSymbol);
  const override = TWELVE_DATA_TO_APP_OVERRIDES[wire];
  if (override) {
    return override;
  }

  return wire.replace(/\//g, '');
}

/**
 * Resolve which app symbols correspond to an incoming Twelve Data wire ticker.
 */
export function matchAppSymbolsForTwelveData(
  incomingTwelveDataSymbol: string,
  appSymbols: Iterable<string>
): string[] {
  const normalizedIncoming = normalizeWireSymbol(incomingTwelveDataSymbol);
  const directAppSymbol = toAppMarketSymbol(incomingTwelveDataSymbol);
  const originalSymbols = Array.from(appSymbols);

  const matches = originalSymbols.filter((symbol) => {
    const normalized = normalizeAppSymbol(symbol);
    if (normalized === directAppSymbol) return true;
    return toTwelveDataSymbolString(symbol) === normalizedIncoming;
  });

  return Array.from(new Set(matches));
}

/**
 * Resolve a single app symbol for an incoming Twelve Data wire ticker.
 */
export function resolveAppSymbolForTwelveData(
  incomingTwelveDataSymbol: string,
  appSymbols: Iterable<string>
): string | null {
  const matches = matchAppSymbolsForTwelveData(
    incomingTwelveDataSymbol,
    appSymbols
  );
  return matches[0] ?? null;
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

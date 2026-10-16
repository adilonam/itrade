import { describe, expect, it } from 'vitest';
import {
  matchAppSymbolsForTwelveData,
  resolveAppSymbolForTwelveData,
  toAppMarketSymbol,
  toTwelveDataSymbolString
} from '@/lib/market-symbol';

describe('toTwelveDataSymbolString', () => {
  it('converts 6-letter FX pairs', () => {
    expect(toTwelveDataSymbolString('EURUSD')).toBe('EUR/USD');
    expect(toTwelveDataSymbolString('eurusd')).toBe('EUR/USD');
  });

  it('converts 6-letter crypto pairs', () => {
    expect(toTwelveDataSymbolString('BTCUSD')).toBe('BTC/USD');
    expect(toTwelveDataSymbolString('ETHUSD')).toBe('ETH/USD');
  });

  it('passes through stocks unchanged', () => {
    expect(toTwelveDataSymbolString('AAPL')).toBe('AAPL');
    expect(toTwelveDataSymbolString('MSFT')).toBe('MSFT');
  });

  it('passes through slash-separated symbols', () => {
    expect(toTwelveDataSymbolString('EUR/USD')).toBe('EUR/USD');
    expect(toTwelveDataSymbolString('BTC-USD')).toBe('BTC/USD');
  });

  it('applies seed-specific overrides', () => {
    expect(toTwelveDataSymbolString('WTI')).toBe('WTI/USD');
    expect(toTwelveDataSymbolString('BRENT')).toBe('BRENT/USD');
    expect(toTwelveDataSymbolString('US500')).toBe('SPX');
  });
});

describe('toAppMarketSymbol', () => {
  it('maps wire FX/crypto back to app symbols', () => {
    expect(toAppMarketSymbol('BTC/USD')).toBe('BTCUSD');
    expect(toAppMarketSymbol('EUR/USD')).toBe('EURUSD');
  });

  it('passes through stocks unchanged', () => {
    expect(toAppMarketSymbol('AAPL')).toBe('AAPL');
  });

  it('applies reverse overrides', () => {
    expect(toAppMarketSymbol('SPX')).toBe('US500');
    expect(toAppMarketSymbol('WTI/USD')).toBe('WTI');
    expect(toAppMarketSymbol('BRENT/USD')).toBe('BRENT');
  });
});

describe('matchAppSymbolsForTwelveData', () => {
  it('matches wire tickers to desired compact app symbols', () => {
    const appSymbols = ['BTCUSD', 'EURUSD', 'AAPL'];
    expect(matchAppSymbolsForTwelveData('BTC/USD', appSymbols)).toEqual([
      'BTCUSD'
    ]);
    expect(matchAppSymbolsForTwelveData('SPX', ['US500', 'AAPL'])).toEqual([
      'US500'
    ]);
  });

  it('preserves wire-format symbols stored in the database', () => {
    const appSymbols = ['BTC/USD', 'EUR/USD', 'AAPL'];
    expect(matchAppSymbolsForTwelveData('BTC/USD', appSymbols)).toEqual([
      'BTC/USD'
    ]);
    expect(matchAppSymbolsForTwelveData('EUR/USD', appSymbols)).toEqual([
      'EUR/USD'
    ]);
  });
});

describe('resolveAppSymbolForTwelveData', () => {
  it('returns the first matching app symbol', () => {
    expect(
      resolveAppSymbolForTwelveData('EUR/USD', ['EURUSD', 'AAPL'])
    ).toBe('EURUSD');
  });
});

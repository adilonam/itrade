import type { LandingIcWidgetSymbol } from '@/constants/data';

export type FormattedPriceParts = {
  prefix: string;
  main: string;
  tail: string;
};

export function formatLandingIcPrice(
  price: number,
  symbol: LandingIcWidgetSymbol
): FormattedPriceParts {
  if (symbol === 'XAUUSD') {
    const [whole, dec = '00'] = price.toFixed(2).split('.');
    return { prefix: `${whole}.`, main: dec, tail: '' };
  }

  const [, dec = '00000'] = price.toFixed(5).split('.');
  const wholePart = Math.floor(price);
  return {
    prefix: `${wholePart}.${dec.slice(0, 2)}`,
    main: dec.slice(2, 4),
    tail: dec.slice(4, 5)
  };
}

export function formatLandingIcSpread(
  symbol: LandingIcWidgetSymbol,
  bid: number,
  ask: number
): string {
  const raw = ask - bid;
  if (symbol === 'XAUUSD') return raw.toFixed(1);
  return (raw * 10000).toFixed(1);
}

export function formatLandingIcPercentChange(percentChange: number): string {
  const sign = percentChange >= 0 ? '+' : '';
  return `${sign}${percentChange.toFixed(2)}%`;
}

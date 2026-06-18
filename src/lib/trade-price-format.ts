/**
 * Format trade prices for display (handles small crypto/meme coin values).
 */
export function formatTradePrice(price: number): string {
  if (!Number.isFinite(price)) return '—';
  if (price === 0) return '0';

  const abs = Math.abs(price);

  let decimals: number;
  if (abs >= 1) {
    decimals = 5;
  } else if (abs >= 0.01) {
    decimals = 5;
  } else if (abs >= 0.0001) {
    decimals = 6;
  } else if (abs >= 0.000001) {
    decimals = 8;
  } else {
    decimals = 10;
  }

  return price.toFixed(decimals).replace(/\.?0+$/, '');
}

/** Full precision for tooltips / titles. */
export function formatTradePriceFull(price: number): string {
  if (!Number.isFinite(price)) return '—';
  const abs = Math.abs(price);
  const decimals = abs >= 1 ? 5 : abs >= 0.000001 ? 10 : 12;
  return price.toFixed(decimals).replace(/\.?0+$/, '');
}

/** Smaller text classes for long prices inside narrow buy/sell buttons. */
export function getTradePriceButtonTextClass(priceText: string): string {
  const len = priceText.length;
  if (len <= 6) return 'text-xs md:text-sm';
  if (len <= 9) return 'text-[11px] md:text-xs';
  if (len <= 11) return 'text-[10px] md:text-[11px]';
  if (len <= 13) return 'text-[9px] md:text-[10px]';
  return 'text-[8px] md:text-[9px]';
}

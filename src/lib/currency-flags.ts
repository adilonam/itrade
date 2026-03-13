/**
 * Maps 3-letter currency codes to flag emoji (regional indicators).
 * Used for forex pair display in trading UI.
 */
const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  JPY: '🇯🇵',
  AUD: '🇦🇺',
  CHF: '🇨🇭',
  CAD: '🇨🇦',
  NZD: '🇳🇿',
  XAU: '🥇',
  XAG: '🥈',
  BTC: '₿',
  ETH: 'Ξ'
};

/**
 * Returns [baseDisplay, quoteDisplay] for a symbol.
 * - EUR/USD or EURUSD → flag for EUR, flag for USD
 * - AAPL (single symbol) → first letter "A", empty string (show one badge)
 */
export function getCurrencyFlags(symbol: string): [string, string] {
  const trimmed = symbol.trim().toUpperCase();

  // Slash-separated: EUR/USD, GBP/JPY
  if (trimmed.includes('/')) {
    const [base, quote] = trimmed.split('/').map((s) => s.trim());
    return [
      CURRENCY_FLAGS[base ?? ''] ?? '💱',
      CURRENCY_FLAGS[quote ?? ''] ?? '💱'
    ];
  }

  // Concatenated forex: EURUSD, GBPJPY (6 chars)
  if (trimmed.length >= 6 && /^[A-Z0-9]{6}$/.test(trimmed)) {
    const base = trimmed.slice(0, 3);
    const quote = trimmed.slice(3, 6);
    return [
      CURRENCY_FLAGS[base] ?? '💱',
      CURRENCY_FLAGS[quote] ?? '💱'
    ];
  }

  // Single symbol (stocks, indices): AAPL, US500 → first letter
  if (trimmed.length > 0) {
    const first = trimmed[0];
    return [first, ''];
  }

  return ['💱', '💱'];
}

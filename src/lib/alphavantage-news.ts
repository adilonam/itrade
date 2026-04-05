/** Alpha Vantage NEWS_SENTIMENT API (see /api/news). */

export type AlphaVantageNewsFeedItem = {
  title: string;
  url: string;
  time_published: string;
  authors?: string[];
  summary: string;
  banner_image?: string;
  source: string;
  overall_sentiment_score?: number;
  overall_sentiment_label?: string;
  ticker_sentiment?: Array<{
    ticker: string;
    ticker_sentiment_label: string;
  }>;
};

export type AlphaVantageNewsApiResponse = {
  feed?: AlphaVantageNewsFeedItem[];
  items?: string;
  sentiment_score_definition?: string;
  relevance_score_definition?: string;
};

/** `time_published` format: YYYYMMDDTHHmmss */
export function formatAlphaVantageNewsDateTime(timePublished: string): string {
  if (!timePublished || timePublished.length < 14) return timePublished;
  const y = timePublished.slice(0, 4);
  const m = timePublished.slice(4, 6);
  const d = timePublished.slice(6, 8);
  const h = timePublished.slice(9, 11);
  const min = timePublished.slice(11, 13);
  return `${y}-${m}-${d} ${h}:${min}`;
}

export function formatAlphaVantageNewsTimeShort(timePublished: string): string {
  if (!timePublished || timePublished.length < 14) return timePublished;
  const h = timePublished.slice(9, 11);
  const min = timePublished.slice(11, 13);
  return `${h}:${min}`;
}

const FOREX_MAJORS = new Set([
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'AUD',
  'CAD',
  'CHF',
  'NZD'
]);

/**
 * Optional `tickers` query for NEWS_SENTIMENT. Returns undefined for a broad market feed.
 */
export function symbolToAlphaVantageNewsTickers(symbol: string): string | undefined {
  const s = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!s) return undefined;

  if (s === 'BTCUSD' || s === 'BTCUSDT') return 'CRYPTO:BTC';
  if (s === 'ETHUSD' || s === 'ETHUSDT') return 'CRYPTO:ETH';
  if (s === 'XAUUSD') return 'GOLD';
  if (s === 'XAGUSD') return 'SILVER';
  if (s === 'US500') return 'SPY';
  if (s === 'GER40' || s === 'DE40') return 'DAX';

  if (s.length === 6) {
    const a = s.slice(0, 3);
    const b = s.slice(3);
    if (FOREX_MAJORS.has(a) && FOREX_MAJORS.has(b)) return `${a},${b}`;
  }

  if (s.length >= 1 && s.length <= 5 && /^[A-Z]+$/.test(s)) return s;

  return undefined;
}

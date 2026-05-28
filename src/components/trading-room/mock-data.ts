export interface MockSymbol {
  id: string;
  symbol: string;
  name: string;
  price: number;
  dailyChange: number; // percentage
  type: string;
}

export interface MockNewsItem {
  id: string;
  title: string;
  time: string;
  snippet: string;
  flag?: string;
  source?: string;
  url?: string;
}

export interface MockCalendarItem {
  id: string;
  time: string;
  title: string;
  impact: 'high' | 'medium' | 'low';
}

export const MOCK_SYMBOLS: MockSymbol[] = [
  { id: 'audusd', symbol: 'AUDUSD', name: 'Australian Dollar vs US Dollar', price: 0.6312, dailyChange: 0.12, type: 'FOREX' },
  { id: 'usdjpy', symbol: 'USDJPY', name: 'US Dollar vs Japanese Yen', price: 149.842, dailyChange: -0.08, type: 'FOREX' },
  { id: 'xauusd', symbol: 'XAUUSD', name: 'Gold vs US Dollar', price: 5145.56, dailyChange: -0.39, type: 'COMMODITIES' },
  { id: 'us500', symbol: 'US500', name: 'US 500', price: 6866.3, dailyChange: -0.94, type: 'INDICES' },
  { id: 'xagusd', symbol: 'XAGUSD', name: 'Silver vs US Dollar', price: 83.527, dailyChange: -0.7, type: 'COMMODITIES' },
  { id: 'gbpjpy', symbol: 'GBPJPY', name: 'British Pound vs Japanese Yen', price: 209.789, dailyChange: 0.39, type: 'FOREX' },
  { id: 'eurusd', symbol: 'EURUSD', name: 'Euro vs US Dollar', price: 1.15621, dailyChange: -0.17, type: 'FOREX' },
  { id: 'gbpusd', symbol: 'GBPUSD', name: 'British Pound vs US Dollar', price: 1.2945, dailyChange: 0.22, type: 'FOREX' },
  { id: 'ger40', symbol: 'GER40', name: 'Germany 40 Index', price: 23890.2, dailyChange: 0.41, type: 'INDICES' },
  { id: 'btcusd', symbol: 'BTCUSD', name: 'Bitcoin vs US Dollar', price: 97234.5, dailyChange: 1.2, type: 'CRYPTO' },
  { id: 'ethusd', symbol: 'ETHUSD', name: 'Ethereum vs US Dollar', price: 3456.78, dailyChange: -0.45, type: 'CRYPTO' },
  { id: 'usdcad', symbol: 'USDCAD', name: 'US Dollar vs Canadian Dollar', price: 1.4321, dailyChange: 0.05, type: 'FOREX' }
];

export const MOCK_NEWS: MockNewsItem[] = [
  {
    id: 'n1',
    title: 'Wall Street futures trim some losses after key inflation data',
    time: '08:36',
    snippet:
      'U.S. stock futures trimmed losses as traders digested broad economic releases, including a slightly soft to in-line inflation print, while renewed Gulf strikes kept geopolitical risk elevated.',
    flag: '🇺🇸',
    source: 'Investing.com',
    url: 'https://www.investing.com/news/stock-market-news/us-stock-futures-steady-post-record-wall-st-close-iran-strikes-pce-data-in-focus-4713535'
  },
  {
    id: 'n2',
    title: 'U.S., Iran exchange strikes dampening hopes for imminent peace deal',
    time: '08:30',
    snippet:
      'Fresh military action between Washington and Tehran reduced confidence in a near-term diplomatic breakthrough and kept cross-asset volatility elevated.',
    flag: '🇮🇷',
    source: 'Investing.com',
    url: 'https://www.investing.com/news/economy-news/us-military-carries-out-more-strikes-on-iran-as-trump-signals-no-deal-in-sight-4713450'
  },
  {
    id: 'n3',
    title: 'Oil prices tick higher amid renewed U.S.-Iran hostilities',
    time: '08:24',
    snippet:
      'Crude prices moved higher as risk premiums returned to energy markets following another escalation in U.S.-Iran tensions.',
    flag: '🛢️',
    source: 'Investing.com',
    url: 'https://www.investing.com/news/commodities-news/oil-prices-jump-nearly-2-after-us-attacks-iran-again-4713494'
  },
  {
    id: 'n4',
    title:
      'UBS flags weather-driven headwinds for this European company despite stable soft commodity prices',
    time: '08:18',
    snippet:
      'Analysts highlighted weather-related operational pressure as a near-term concern, even with softer commodity inputs remaining broadly stable.',
    flag: '🇪🇺',
    source: 'Investing.com',
    url: 'https://www.investing.com/news/pro/ubs-flags-weatherdriven-headwinds-for-this-european-company-despite-stable-soft-commodity-prices-432SI-4713865'
  },
  {
    id: 'n5',
    title:
      'Gold prices slide as U.S.-Iran hostilities keep inflation, rate hike fears in focus',
    time: '08:10',
    snippet:
      'Bullion eased as higher oil and geopolitical stress reinforced uncertainty around inflation and potential policy tightening paths.',
    flag: '🥇',
    source: 'Investing.com',
    url: 'https://www.investing.com/news/commodities-news/gold-prices-dip-as-fresh-usiran-attacks-boost-oil-dollar-4713551'
  }
];

export const MOCK_CALENDAR: MockCalendarItem[] = [
  { id: 'c1', time: 'Thu 08:30', title: 'US Initial Jobless Claims', impact: 'high' },
  { id: 'c2', time: 'Thu 10:00', title: 'Eurozone Consumer Confidence', impact: 'medium' },
  { id: 'c3', time: 'Fri 12:30', title: 'US Core PCE Price Index', impact: 'high' },
  { id: 'c4', time: 'Fri 14:00', title: 'Fed speaker — monetary policy', impact: 'low' }
];

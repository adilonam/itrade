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
    title: 'Stock indexes dip nearly 2% on chip sell-off, Trump\u2019s threat of more Iran attacks',
    time: '15:42',
    snippet:
      'Wall Street on Wednesday slumped after President Donald Trump ratcheted up his rhetoric against Iran and said the U.S. would "hit them hard" for a second straight day. Losses had been capped somewhat in the morning after a soft to in-line U.S. consumer inflation report, but the escalation in geopolitical tensions and a semiconductor sell-off deepened the decline.',
    flag: '🇺🇸',
    source: 'Investing.com',
    url: 'https://www.investing.com/news/stock-market-news/stock-indexes-dip-nearly-2-on-chip-sell-off-trumps-threat-of-more-iran-attacks-4714200'
  },
  {
    id: 'n2',
    title: 'U.S. consumer prices rise by 4.2% annually in May',
    time: '08:30',
    snippet:
      'The U.S. consumer price index rose 4.2% year-over-year in May, in line with expectations, offering traders a modest reprieve before geopolitical headlines and chip-sector weakness dominated the session.',
    flag: '🇺🇸',
    source: 'Investing.com',
    url: 'https://www.investing.com/news/economic-indicators/us-consumer-prices-rise-by-42-annually-in-may-4714100'
  },
  {
    id: 'n3',
    title: 'The Number 10 Mindset: Setting the Highest Standards with TenTrade',
    time: '08:15',
    snippet:
      'TenTrade explores the discipline and standards behind consistent trading performance — from risk management to execution under pressure.',
    flag: '📰',
    source: 'Partner News'
  },
  {
    id: 'n4',
    title: 'Earnings could be a positive catalyst for this stock: UBS',
    time: '07:58',
    snippet:
      'UBS analysts see upcoming earnings as a potential upside catalyst, citing improving fundamentals and favorable sector positioning despite broader market volatility.',
    flag: '📈',
    source: 'Pro',
    url: 'https://www.investing.com/news/pro/earnings-could-be-a-positive-catalyst-for-this-stock-ubs-4714050'
  },
  {
    id: 'n5',
    title: 'Gold slides more than 4% as Trump threatens more Iran attacks',
    time: '07:45',
    snippet:
      'Gold fell more than 4% as President Trump signaled further U.S. strikes on Iran, boosting the dollar and reducing safe-haven demand for bullion.',
    flag: '🥇',
    source: 'Investing.com',
    url: 'https://www.investing.com/news/commodities-news/gold-slides-more-than-4-as-trump-threatens-more-iran-attacks-4714000'
  }
];

export const MOCK_CALENDAR: MockCalendarItem[] = [
  { id: 'c1', time: 'Thu 08:30', title: 'US Initial Jobless Claims', impact: 'high' },
  { id: 'c2', time: 'Thu 10:00', title: 'Eurozone Consumer Confidence', impact: 'medium' },
  { id: 'c3', time: 'Fri 12:30', title: 'US Core PCE Price Index', impact: 'high' },
  { id: 'c4', time: 'Fri 14:00', title: 'Fed speaker — monetary policy', impact: 'low' }
];

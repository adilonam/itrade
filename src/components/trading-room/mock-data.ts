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
    id: '1',
    title: 'Japanese Yen stays defensive ahead of CPI',
    time: '23:03',
    snippet: 'Tokyo inflation expectations weigh on carry trades as traders trim exposure.',
    flag: '🇯🇵'
  },
  {
    id: '2',
    title: 'Pound Sterling declines as US prepares data',
    time: '23:00',
    snippet: 'Cable retreats from session highs as the dollar firms across the board.',
    flag: '🇬🇧'
  },
  {
    id: '3',
    title: 'US considers ground operation headlines',
    time: '22:50',
    snippet: 'Risk sentiment flickers; crude and safe havens see two-way flows.',
    flag: '🇺🇸'
  },
  {
    id: '4',
    title: 'ECB officials hint at measured cuts',
    time: '22:12',
    snippet: 'Money markets price a shallow easing path through year-end.',
    flag: '🇪🇺'
  },
  {
    id: '5',
    title: 'Oil inventories surprise to the downside',
    time: '21:40',
    snippet: 'WTI bounces from lows as stockpiles shrink more than expected.',
    flag: '🛢️'
  }
];

export const MOCK_CALENDAR: MockCalendarItem[] = [
  { id: 'c1', time: 'Thu 08:30', title: 'US Initial Jobless Claims', impact: 'high' },
  { id: 'c2', time: 'Thu 10:00', title: 'Eurozone Consumer Confidence', impact: 'medium' },
  { id: 'c3', time: 'Fri 12:30', title: 'US Core PCE Price Index', impact: 'high' },
  { id: 'c4', time: 'Fri 14:00', title: 'Fed speaker — monetary policy', impact: 'low' }
];

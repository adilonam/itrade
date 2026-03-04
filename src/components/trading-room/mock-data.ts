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
}

export const MOCK_SYMBOLS: MockSymbol[] = [
  { id: 'xauusd', symbol: 'XAUUSD', name: 'Gold vs US Dollar', price: 5145.56, dailyChange: -0.39, type: 'COMMODITIES' },
  { id: 'us500', symbol: 'US500', name: 'US 500', price: 6866.3, dailyChange: -0.94, type: 'INDICES' },
  { id: 'xagusd', symbol: 'XAGUSD', name: 'Silver vs US Dollar', price: 83.527, dailyChange: -0.7, type: 'COMMODITIES' },
  { id: 'gbpjpy', symbol: 'GBPJPY', name: 'British Pound vs Japanese Yen', price: 209.789, dailyChange: 0.39, type: 'FOREX' },
  { id: 'eurusd', symbol: 'EURUSD', name: 'Euro vs US Dollar', price: 1.16313, dailyChange: -0.17, type: 'FOREX' },
  { id: 'btcusd', symbol: 'BTCUSD', name: 'Bitcoin vs US Dollar', price: 97234.5, dailyChange: 1.2, type: 'CRYPTO' },
  { id: 'ethusd', symbol: 'ETHUSD', name: 'Ethereum vs US Dollar', price: 3456.78, dailyChange: -0.45, type: 'CRYPTO' },
];

export const MOCK_NEWS: MockNewsItem[] = [
  { id: '1', title: 'USD/JPY pulls back from one-month highs...', time: '16:20' },
  { id: '2', title: 'Russia Unemployment came in at 2.2%...', time: '15:58' },
  { id: '3', title: 'GBP/USD rebounds toward 1.34 as markets...', time: '15:52' },
  { id: '4', title: 'United States EIA Crude Oil Stocks Change...', time: '15:30' },
  { id: '5', title: 'ECB signals cautious approach to rate cuts...', time: '14:45' },
];

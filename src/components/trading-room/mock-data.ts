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
    title: 'US–Iran tensions flare after Strait incident; oil spikes in late trade',
    time: '23:18',
    snippet:
      'Markets price higher geopolitical risk as officials trade warnings and energy routes come under scrutiny. Safe-haven flows into USD and gold intensify.',
    flag: '🇺🇸',
    source: 'Desk wire (mock)'
  },
  {
    id: 'n2',
    title: 'Pentagon confirms expanded carrier presence; Tehran vows proportional response',
    time: '22:55',
    snippet:
      'Defense channels report additional naval assets; diplomatic channels remain open but fragile. Volatility in crude and regional FX expected overnight.',
    flag: '🇮🇷',
    source: 'Desk wire (mock)'
  },
  {
    id: 'n3',
    title: 'Japan–US trade officials meet ahead of tariff review; yen whipsaws',
    time: '22:40',
    snippet:
      'Tokyo and Washington discuss industrial policy and supply chains. USD/JPY swings on headline risk as traders reposition into the Tokyo open.',
    flag: '🇯🇵',
    source: 'Desk wire (mock)'
  },
  {
    id: 'n4',
    title: 'White House: “All options on table” re Iran; allies urge de-escalation',
    time: '22:12',
    snippet:
      'European and Gulf partners call for restraint; risk assets pare gains while energy complex leads sector moves.',
    flag: '🇺🇸',
    source: 'Desk wire (mock)'
  },
  {
    id: 'n5',
    title: 'BoJ watchers eye yield curve after US–Japan joint statement on stability',
    time: '21:50',
    snippet:
      'Fixed-income desks parse language on FX and financial stability; JGB futures tick higher as curve flattens.',
    flag: '🇯🇵',
    source: 'Desk wire (mock)'
  },
  {
    id: 'n6',
    title: 'UN Security Council session requested on US–Iran standoff',
    time: '21:22',
    snippet:
      'Diplomatic calendar fills up; emerging-market FX shows cautious bid as liquidity thins into the New York close.',
    flag: '🇺🇳',
    source: 'Desk wire (mock)'
  }
];

export const MOCK_CALENDAR: MockCalendarItem[] = [
  { id: 'c1', time: 'Thu 08:30', title: 'US Initial Jobless Claims', impact: 'high' },
  { id: 'c2', time: 'Thu 10:00', title: 'Eurozone Consumer Confidence', impact: 'medium' },
  { id: 'c3', time: 'Fri 12:30', title: 'US Core PCE Price Index', impact: 'high' },
  { id: 'c4', time: 'Fri 14:00', title: 'Fed speaker — monetary policy', impact: 'low' }
];

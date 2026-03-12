export interface BotMarketplaceItem {
  id: string;
  name: string;
  description: string;
  strategy: string;
  performance30d: number;
  performance90d: number;
  minCapital: number;
  subscribers: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'ACTIVE' | 'COMING_SOON';
}

export interface MyBotItem {
  id: string;
  botId: string;
  botName: string;
  strategy: string;
  allocatedCapital: number;
  pnl: number;
  pnlPercent: number;
  status: 'RUNNING' | 'PAUSED' | 'STOPPED';
  startedAt: string;
}

export interface BotPositionItem {
  id: string;
  myBotId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  openedAt: string;
}

export const MOCK_BOT_MARKETPLACE: BotMarketplaceItem[] = [
  {
    id: 'bot-1',
    name: 'Trend Scout',
    description: 'Follows momentum and trend-following signals on major forex pairs.',
    strategy: 'Momentum',
    performance30d: 4.2,
    performance90d: 12.8,
    minCapital: 500,
    subscribers: 1240,
    riskLevel: 'MEDIUM',
    status: 'ACTIVE'
  },
  {
    id: 'bot-2',
    name: 'Scalper Pro',
    description: 'High-frequency scalping on indices with tight stop-loss.',
    strategy: 'Scalping',
    performance30d: 2.1,
    performance90d: 8.4,
    minCapital: 1000,
    subscribers: 892,
    riskLevel: 'HIGH',
    status: 'ACTIVE'
  },
  {
    id: 'bot-3',
    name: 'Safe Yield',
    description: 'Conservative grid strategy on EUR/USD and GBP/USD.',
    strategy: 'Grid',
    performance30d: 1.8,
    performance90d: 5.2,
    minCapital: 200,
    subscribers: 2103,
    riskLevel: 'LOW',
    status: 'ACTIVE'
  },
  {
    id: 'bot-4',
    name: 'Breakout King',
    description: 'Detects breakouts and enters with trailing stop.',
    strategy: 'Breakout',
    performance30d: 5.6,
    performance90d: 18.3,
    minCapital: 750,
    subscribers: 567,
    riskLevel: 'MEDIUM',
    status: 'ACTIVE'
  },
  {
    id: 'bot-5',
    name: 'DCA Master',
    description: 'Dollar-cost averaging across selected crypto and forex.',
    strategy: 'DCA',
    performance30d: 0.9,
    performance90d: 4.1,
    minCapital: 100,
    subscribers: 3421,
    riskLevel: 'LOW',
    status: 'ACTIVE'
  },
  {
    id: 'bot-6',
    name: 'Volatility Hunter',
    description: 'Options-style volatility plays (coming soon).',
    strategy: 'Volatility',
    performance30d: 0,
    performance90d: 0,
    minCapital: 2000,
    subscribers: 0,
    riskLevel: 'HIGH',
    status: 'COMING_SOON'
  }
];

export const MOCK_MY_BOTS: MyBotItem[] = [
  {
    id: 'my-bot-1',
    botId: 'bot-1',
    botName: 'Trend Scout',
    strategy: 'Momentum',
    allocatedCapital: 1000,
    pnl: 42.5,
    pnlPercent: 4.25,
    status: 'RUNNING',
    startedAt: '2025-01-15T10:00:00Z'
  },
  {
    id: 'my-bot-2',
    botId: 'bot-3',
    botName: 'Safe Yield',
    strategy: 'Grid',
    allocatedCapital: 500,
    pnl: 8.2,
    pnlPercent: 1.64,
    status: 'RUNNING',
    startedAt: '2025-02-01T14:30:00Z'
  }
];

export const MOCK_BOT_POSITIONS: BotPositionItem[] = [
  {
    id: 'pos-1',
    myBotId: 'my-bot-1',
    symbol: 'EUR/USD',
    type: 'BUY',
    quantity: 0.1,
    entryPrice: 1.0845,
    currentPrice: 1.0862,
    pnl: 17,
    openedAt: '2025-02-20T09:15:00Z'
  },
  {
    id: 'pos-2',
    myBotId: 'my-bot-1',
    symbol: 'GBP/USD',
    type: 'SELL',
    quantity: 0.05,
    entryPrice: 1.2650,
    currentPrice: 1.2638,
    pnl: 6,
    openedAt: '2025-02-20T11:00:00Z'
  },
  {
    id: 'pos-3',
    myBotId: 'my-bot-2',
    symbol: 'EUR/USD',
    type: 'BUY',
    quantity: 0.02,
    entryPrice: 1.0830,
    currentPrice: 1.0862,
    pnl: 6.4,
    openedAt: '2025-02-19T16:00:00Z'
  }
];

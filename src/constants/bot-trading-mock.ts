import type { Bot } from '@/lib/prisma/generated/client';

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
  /** Maps to Prisma Bot enum */
  bot: Bot;
}

export interface RsiBotParams {
  period: number;
  overbought: number;
  oversold: number;
}

export interface GridTradingBotParams {
  gridLevels: number;
  stepPercent: number;
}

export interface TrendFollowingBotParams {
  emaPeriod: number;
  trendStrength: number;
}

export type BotParamsMap = {
  RSI: RsiBotParams;
  GRID_TRADING: GridTradingBotParams;
  TREND_FOLLOWING: TrendFollowingBotParams;
};

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

/** Only RSI, Grid Trading, Trend Following */
export const MOCK_BOT_MARKETPLACE: BotMarketplaceItem[] = [
  {
    id: 'bot-rsi',
    name: 'RSI Bot',
    description: 'Relative Strength Index signals for overbought/oversold entries.',
    strategy: 'RSI',
    performance30d: 3.2,
    performance90d: 9.6,
    minCapital: 10,
    subscribers: 1520,
    riskLevel: 'MEDIUM',
    status: 'ACTIVE',
    bot: 'RSI'
  },
  {
    id: 'bot-grid',
    name: 'Grid Trading',
    description: 'Conservative grid strategy on forex and crypto pairs.',
    strategy: 'Grid',
    performance30d: 1.8,
    performance90d: 5.2,
    minCapital: 10,
    subscribers: 2103,
    riskLevel: 'LOW',
    status: 'ACTIVE',
    bot: 'GRID_TRADING'
  },
  {
    id: 'bot-trend',
    name: 'Trend Following',
    description: 'Follows momentum and trend-following signals on major pairs.',
    strategy: 'Trend',
    performance30d: 4.2,
    performance90d: 12.8,
    minCapital: 10,
    subscribers: 1240,
    riskLevel: 'MEDIUM',
    status: 'ACTIVE',
    bot: 'TREND_FOLLOWING'
  }
];

export const DEFAULT_BOT_PARAMS: BotParamsMap = {
  RSI: { period: 14, overbought: 70, oversold: 30 },
  GRID_TRADING: { gridLevels: 10, stepPercent: 0.5 },
  TREND_FOLLOWING: { emaPeriod: 20, trendStrength: 2 }
};

export const MOCK_MY_BOTS: MyBotItem[] = [
  {
    id: 'my-bot-1',
    botId: 'bot-rsi',
    botName: 'RSI Bot',
    strategy: 'RSI',
    allocatedCapital: 1000,
    pnl: 42.5,
    pnlPercent: 4.25,
    status: 'RUNNING',
    startedAt: '2025-01-15T10:00:00Z'
  },
  {
    id: 'my-bot-2',
    botId: 'bot-grid',
    botName: 'Grid Trading',
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

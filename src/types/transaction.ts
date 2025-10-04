import type {
  Transaction,
  TransactionType,
  TransactionStatus,
  MarketType,
  Room
} from '@prisma/client';

export interface TransactionWithRelations extends Transaction {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  market: {
    id: string;
    symbol: string;
    name: string;
    type: MarketType;
  } | null;
}

export interface CreateTransactionData {
  userId: string;
  type: TransactionType;
  status?: TransactionStatus;
  room?: Room;
  marketId?: string;
  quantity: number;
  executedPrice?: number;
  closedPrice?: number;
  takeProfit?: number;
  stopLoss?: number;
  description?: string;
  executedAt?: Date;
  closedAt?: Date;
  pnl?: number;
}

export interface UpdateTransactionData {
  type?: TransactionType;
  status?: TransactionStatus;
  room?: Room;
  marketId?: string;
  quantity?: number;
  executedPrice?: number;
  closedPrice?: number;
  takeProfit?: number;
  stopLoss?: number;
  description?: string;
  executedAt?: Date;
  closedAt?: Date;
  pnl?: number;
}

export interface TransactionFilters {
  userId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  room?: Room;
  marketId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface TransactionStats {
  totalTransactions: number;
  totalVolume: number;
  totalPnL: number;
  completedTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
}

export { TransactionType, TransactionStatus, MarketType, Room };

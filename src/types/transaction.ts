import type {
  Transaction,
  TransactionType,
  TransactionStatus,
  MarketType
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
  marketId?: string;
  quantity: number;
  executedPrice?: number;
  closedPrice?: number;
  description?: string;
  executedAt?: Date;
  closedAt?: Date;
  pnl?: number;
}

export interface UpdateTransactionData {
  type?: TransactionType;
  status?: TransactionStatus;
  marketId?: string;
  quantity?: number;
  executedPrice?: number;
  closedPrice?: number;
  description?: string;
  executedAt?: Date;
  closedAt?: Date;
  pnl?: number;
}

export interface TransactionFilters {
  userId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
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

export { TransactionType, TransactionStatus, MarketType };

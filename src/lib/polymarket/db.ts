import { prisma } from '@/lib/prisma';

export { prisma };

export type {
  User,
  EmailOtp,
  MarketGroup,
  Market,
  Outcome,
  Trade,
  BalanceLedger,
  Comment,
  PriceHistory,
  OrderBookLevel,
  Prisma
} from '@/lib/polymarket/db-types';

export {
  MarketCategory,
  MarketStatus,
  OutcomeType,
  TradeSide,
  OrderType,
  UserRole,
  BalanceLedgerType
} from '@/lib/polymarket/db-types';

export { isPolymarketAdmin } from '@/lib/polymarket/roles';

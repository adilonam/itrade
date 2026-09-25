/**
 * Browser-safe Prisma enums and model types for Polymarket.
 * Client Components must import from here — never from `@/lib/polymarket/db`.
 *
 * Note: Prisma generates `const` + `type` with the same name. Re-export via
 * `export { X as Y }` can be erased as type-only under isolatedModules, so we
 * bind value aliases explicitly.
 */

import {
  PredictionBalanceLedgerType,
  PredictionMarketCategory,
  PredictionMarketStatus,
  PredictionOrderType,
  PredictionOutcomeType,
  PredictionTradeSide
} from '@/lib/prisma/generated/enums';

export const MarketCategory = PredictionMarketCategory;
export const MarketStatus = PredictionMarketStatus;
export const OutcomeType = PredictionOutcomeType;
export const TradeSide = PredictionTradeSide;
export const OrderType = PredictionOrderType;
export const BalanceLedgerType = PredictionBalanceLedgerType;

export type MarketCategory =
  (typeof PredictionMarketCategory)[keyof typeof PredictionMarketCategory];
export type MarketStatus =
  (typeof PredictionMarketStatus)[keyof typeof PredictionMarketStatus];
export type OutcomeType =
  (typeof PredictionOutcomeType)[keyof typeof PredictionOutcomeType];
export type TradeSide =
  (typeof PredictionTradeSide)[keyof typeof PredictionTradeSide];
export type OrderType =
  (typeof PredictionOrderType)[keyof typeof PredictionOrderType];
export type BalanceLedgerType =
  (typeof PredictionBalanceLedgerType)[keyof typeof PredictionBalanceLedgerType];

export type {
  User,
  EmailOtp,
  PredictionMarketGroup as MarketGroup,
  PredictionMarket as Market,
  PredictionOutcome as Outcome,
  PredictionTrade as Trade,
  PredictionBalanceLedger as BalanceLedger,
  PredictionComment as Comment,
  PredictionPriceHistory as PriceHistory,
  PredictionOrderBookLevel as OrderBookLevel,
  Prisma
} from '@/lib/prisma/generated/browser';

export { UserRole, type UserRole as UserRoleType } from '@/lib/polymarket/roles';

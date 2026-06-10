import { parseBalanceType } from '@/lib/balance';

export type TradeBalanceType = 'REAL' | 'DEMO';

export const TRADE_BALANCE_TYPES: TradeBalanceType[] = ['REAL', 'DEMO'];

export const TRADE_BALANCE_STORAGE_KEY = 'trade:selected-balance-type';
export const TRADE_BALANCE_COOKIE = 'trade_balance_type';
export const TRADE_BALANCE_CHANGE_EVENT = 'trade-balance-type-changed';

type TradeBalanceChangeEventDetail = {
  balanceType: TradeBalanceType;
};

export function parseTradeBalanceType(input: unknown): TradeBalanceType {
  return parseBalanceType(input) as TradeBalanceType;
}

export function getStoredTradeBalanceType(): TradeBalanceType | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = window.localStorage.getItem(TRADE_BALANCE_STORAGE_KEY);
    if (!saved) return null;
    return parseTradeBalanceType(saved);
  } catch {
    return null;
  }
}

export function persistTradeBalanceTypeLocal(balanceType: TradeBalanceType): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TRADE_BALANCE_STORAGE_KEY, balanceType);
  } catch {
    // Best effort only.
  }
}

export function broadcastTradeBalanceTypeChange(balanceType: TradeBalanceType): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<TradeBalanceChangeEventDetail>(TRADE_BALANCE_CHANGE_EVENT, {
      detail: { balanceType }
    })
  );
}

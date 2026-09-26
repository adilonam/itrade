import type { TradeBalanceType } from "@/lib/balance-selection"

export type UserBalanceAmounts = Record<TradeBalanceType, number>

export function emptyBalances(): UserBalanceAmounts {
  return {
    REAL: 0,
    DEMO: 0,
  }
}

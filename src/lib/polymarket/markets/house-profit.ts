import { OutcomeType, TradeSide, type Prisma } from "@/lib/polymarket/db"
import type { TradeBalanceType } from "@/lib/balance-selection"

type TradeForHouseProfitSource = Prisma.PredictionTradeGetPayload<{
  select: {
    userId: true
    side: true
    amount: true
    shares: true
    balanceType: true
    outcome: { select: { type: true } }
  }
}>

/** Flattened trade fields needed for house-profit math (not a full Trade row). */
export type TradeForHouseProfit = {
  userId: TradeForHouseProfitSource["userId"]
  side: TradeForHouseProfitSource["side"]
  amount: TradeForHouseProfitSource["amount"]
  shares: TradeForHouseProfitSource["shares"]
  balanceType: TradeBalanceType
  outcomeType: TradeForHouseProfitSource["outcome"]["type"]
}

export type HouseProfitPair = {
  profitIfYes: number
  profitIfNo: number
}

export type HouseProfitsByBalance = HouseProfitPair & {
  real: HouseProfitPair
  demo: HouseProfitPair
}

/**
 * Casino/house profit if outcome `winning` settles at $1 per net winning share.
 *
 * profit(W) = Σ BUY amounts − Σ SELL amounts − Σ max(0, net_shares_user on W)
 * where net shares are BUY − SELL per (userId, balanceType, outcome W).
 */
export function houseProfitIfResolved(
  trades: TradeForHouseProfit[],
  winning: OutcomeType
): number {
  let buySum = 0
  let sellSum = 0
  const netByUserBalance = new Map<string, number>()

  for (const trade of trades) {
    if (trade.side === TradeSide.BUY) {
      buySum += trade.amount
    } else {
      sellSum += trade.amount
    }

    if (trade.outcomeType !== winning) {
      continue
    }
    const signed =
      trade.side === TradeSide.BUY ? trade.shares : -trade.shares
    const key = `${trade.userId}:${trade.balanceType}`
    netByUserBalance.set(key, (netByUserBalance.get(key) ?? 0) + signed)
  }

  let payout = 0
  for (const netShares of Array.from(netByUserBalance.values())) {
    if (netShares > 0) {
      payout += netShares
    }
  }

  return buySum - sellSum - payout
}

function profitsForTrades(trades: TradeForHouseProfit[]): HouseProfitPair {
  return {
    profitIfYes: houseProfitIfResolved(trades, OutcomeType.YES),
    profitIfNo: houseProfitIfResolved(trades, OutcomeType.NO),
  }
}

export function houseProfitsForMarket(
  trades: TradeForHouseProfit[]
): HouseProfitsByBalance {
  const real = profitsForTrades(
    trades.filter((trade) => trade.balanceType === "REAL")
  )
  const demo = profitsForTrades(
    trades.filter((trade) => trade.balanceType === "DEMO")
  )
  return {
    profitIfYes: real.profitIfYes + demo.profitIfYes,
    profitIfNo: real.profitIfNo + demo.profitIfNo,
    real,
    demo,
  }
}

export function houseProfitIfResolvedByBalance(
  trades: TradeForHouseProfit[],
  winning: OutcomeType
): { total: number; real: number; demo: number } {
  const realTrades = trades.filter((trade) => trade.balanceType === "REAL")
  const demoTrades = trades.filter((trade) => trade.balanceType === "DEMO")
  const real = houseProfitIfResolved(realTrades, winning)
  const demo = houseProfitIfResolved(demoTrades, winning)
  return { total: real + demo, real, demo }
}

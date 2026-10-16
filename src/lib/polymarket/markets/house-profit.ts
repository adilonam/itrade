import { OutcomeType, TradeSide, type Prisma } from "@/lib/polymarket/db"

type TradeForHouseProfitSource = Prisma.PredictionTradeGetPayload<{
  select: {
    userId: true
    side: true
    amount: true
    shares: true
    outcome: { select: { type: true } }
  }
}>

/** Flattened trade fields needed for house-profit math (not a full Trade row). */
export type TradeForHouseProfit = {
  userId: TradeForHouseProfitSource["userId"]
  side: TradeForHouseProfitSource["side"]
  amount: TradeForHouseProfitSource["amount"]
  shares: TradeForHouseProfitSource["shares"]
  outcomeType: TradeForHouseProfitSource["outcome"]["type"]
}

/**
 * Casino/house profit if outcome `winning` settles at $1 per net winning share.
 *
 * profit(W) = Σ BUY amounts − Σ SELL amounts − Σ max(0, net_shares_user on W)
 * where net shares are BUY − SELL per (userId, outcome W).
 */
export function houseProfitIfResolved(
  trades: TradeForHouseProfit[],
  winning: OutcomeType
): number {
  let buySum = 0
  let sellSum = 0
  const netByUser = new Map<string, number>()

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
    netByUser.set(
      trade.userId,
      (netByUser.get(trade.userId) ?? 0) + signed
    )
  }

  let payout = 0
  for (const netShares of Array.from(netByUser.values())) {
    if (netShares > 0) {
      payout += netShares
    }
  }

  return buySum - sellSum - payout
}

export function houseProfitsForMarket(trades: TradeForHouseProfit[]): {
  profitIfYes: number
  profitIfNo: number
} {
  return {
    profitIfYes: houseProfitIfResolved(trades, OutcomeType.YES),
    profitIfNo: houseProfitIfResolved(trades, OutcomeType.NO),
  }
}

import { unstable_noStore as noStore } from "next/cache"

import type { TradeBalanceType } from "@/lib/balance-selection"
import {
  resolveAdminPagination,
  type AdminPaginatedResult,
  type AdminPaginationInput,
} from "@/lib/polymarket/admin/pagination"
import {
  houseProfitIfResolved,
  type TradeForHouseProfit,
} from "@/lib/polymarket/markets/house-profit"
import { MarketStatus, OutcomeType, prisma, type Prisma } from "@/lib/polymarket/db"

const settledMarketSelect = {
  id: true,
  slug: true,
  title: true,
  category: true,
  winningOutcome: true,
  resolutionDate: true,
  totalVolume: true,
} satisfies Prisma.PredictionMarketSelect

type SettledMarketRow = Prisma.PredictionMarketGetPayload<{
  select: typeof settledMarketSelect
}>

/** One settled market’s house P&L for a single balance wallet. */
export type AdminResolvedMarketProfit = Omit<
  SettledMarketRow,
  "resolutionDate" | "winningOutcome" | "totalVolume"
> & {
  resolutionDate: string
  winningOutcome: OutcomeType
  balanceType: TradeBalanceType
  tradeCount: number
  /** Sum of buy/sell amounts for this balance on the market. */
  volume: number
  profit: number
}

/** Summary stats for one balance wallet across settled markets. */
export type AdminBalanceProfitSummary = {
  balanceType: TradeBalanceType
  totalProfit: number
  settledCount: number
  totalVolume: number
  avgProfitPerMarket: number
  tradeCount: number
}

export type AdminProfitOverview = {
  pendingDecisionCount: number
  real: AdminBalanceProfitSummary
  demo: AdminBalanceProfitSummary
}

const tradeSelect = {
  marketId: true,
  userId: true,
  side: true,
  amount: true,
  shares: true,
  balanceType: true,
  outcome: { select: { type: true } },
} satisfies Prisma.PredictionTradeSelect

async function loadTradesByMarketIds(
  marketIds: string[]
): Promise<Map<string, TradeForHouseProfit[]>> {
  if (marketIds.length === 0) {
    return new Map()
  }

  const trades = await prisma.predictionTrade.findMany({
    where: { marketId: { in: marketIds } },
    select: tradeSelect,
  })

  const tradesByMarket = new Map<string, TradeForHouseProfit[]>()

  for (const trade of trades) {
    const list = tradesByMarket.get(trade.marketId) ?? []
    list.push({
      userId: trade.userId,
      side: trade.side,
      amount: trade.amount,
      shares: trade.shares,
      balanceType: trade.balanceType as TradeBalanceType,
      outcomeType: trade.outcome.type,
    })
    tradesByMarket.set(trade.marketId, list)
  }

  return tradesByMarket
}

function tradesForBalance(
  trades: TradeForHouseProfit[],
  balanceType: TradeBalanceType
): TradeForHouseProfit[] {
  return trades.filter((trade) => trade.balanceType === balanceType)
}

function volumeForTrades(trades: TradeForHouseProfit[]): number {
  return trades.reduce((sum, trade) => sum + trade.amount, 0)
}

function emptyBalanceSummary(
  balanceType: TradeBalanceType
): AdminBalanceProfitSummary {
  return {
    balanceType,
    totalProfit: 0,
    settledCount: 0,
    totalVolume: 0,
    avgProfitPerMarket: 0,
    tradeCount: 0,
  }
}

function summarizeBalance(
  balanceType: TradeBalanceType,
  settledWithOutcome: Array<SettledMarketRow & { winningOutcome: OutcomeType }>,
  tradesByMarket: Map<string, TradeForHouseProfit[]>
): AdminBalanceProfitSummary {
  let totalProfit = 0
  let totalVolume = 0
  let tradeCount = 0
  let settledCount = 0

  for (const market of settledWithOutcome) {
    const scoped = tradesForBalance(
      tradesByMarket.get(market.id) ?? [],
      balanceType
    )
    if (scoped.length === 0) {
      continue
    }
    settledCount += 1
    tradeCount += scoped.length
    totalVolume += volumeForTrades(scoped)
    totalProfit += houseProfitIfResolved(scoped, market.winningOutcome)
  }

  return {
    balanceType,
    totalProfit,
    settledCount,
    totalVolume,
    avgProfitPerMarket: settledCount > 0 ? totalProfit / settledCount : 0,
    tradeCount,
  }
}

export async function getAdminProfitOverview(): Promise<AdminProfitOverview> {
  noStore()

  const [settledMarkets, pendingDecisionCount] = await Promise.all([
    prisma.predictionMarket.findMany({
      where: {
        status: MarketStatus.resolved,
        winningOutcome: { not: null },
      },
      select: settledMarketSelect,
      orderBy: { resolutionDate: "desc" },
    }),
    prisma.predictionMarket.count({
      where: {
        status: MarketStatus.resolved,
        winningOutcome: null,
      },
    }),
  ])

  const settledWithOutcome = settledMarkets.filter(
    (market): market is SettledMarketRow & { winningOutcome: OutcomeType } =>
      market.winningOutcome != null
  )

  if (settledWithOutcome.length === 0) {
    return {
      pendingDecisionCount,
      real: emptyBalanceSummary("REAL"),
      demo: emptyBalanceSummary("DEMO"),
    }
  }

  const tradesByMarket = await loadTradesByMarketIds(
    settledWithOutcome.map((market) => market.id)
  )

  return {
    pendingDecisionCount,
    real: summarizeBalance("REAL", settledWithOutcome, tradesByMarket),
    demo: summarizeBalance("DEMO", settledWithOutcome, tradesByMarket),
  }
}

/** Settled markets that have at least one trade on `balanceType`, with that wallet’s P&L. */
export async function listAdminResolvedMarketProfitsForBalance(
  balanceType: TradeBalanceType,
  options: AdminPaginationInput
): Promise<AdminPaginatedResult<AdminResolvedMarketProfit>> {
  noStore()

  const settledMarkets = await prisma.predictionMarket.findMany({
    where: {
      status: MarketStatus.resolved,
      winningOutcome: { not: null },
      trades: { some: { balanceType } },
    },
    orderBy: { resolutionDate: "desc" },
    select: settledMarketSelect,
  })

  const settledWithOutcome = settledMarkets.filter(
    (market): market is SettledMarketRow & { winningOutcome: OutcomeType } =>
      market.winningOutcome != null
  )

  const totalCount = settledWithOutcome.length
  const { page, pageSize, totalPages, skip, take } = resolveAdminPagination(
    totalCount,
    options
  )

  if (totalCount === 0) {
    return { items: [], totalCount, page, pageSize, totalPages }
  }

  const pageMarkets = settledWithOutcome.slice(skip, skip + take)
  const tradesByMarket = await loadTradesByMarketIds(
    pageMarkets.map((market) => market.id)
  )

  const items = pageMarkets.map((market) => {
    const scoped = tradesForBalance(
      tradesByMarket.get(market.id) ?? [],
      balanceType
    )
    return {
      id: market.id,
      slug: market.slug,
      title: market.title,
      category: market.category,
      winningOutcome: market.winningOutcome,
      resolutionDate: market.resolutionDate.toISOString(),
      balanceType,
      tradeCount: scoped.length,
      volume: volumeForTrades(scoped),
      profit: houseProfitIfResolved(scoped, market.winningOutcome),
    }
  })

  return { items, totalCount, page, pageSize, totalPages }
}

import { unstable_noStore as noStore } from "next/cache"

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

export type AdminResolvedMarketProfit = Omit<
  SettledMarketRow,
  "resolutionDate" | "winningOutcome"
> & {
  resolutionDate: string
  winningOutcome: OutcomeType
  tradeCount: number
  profit: number
}

export type AdminProfitSummary = {
  totalProfit: number
  settledCount: number
  pendingDecisionCount: number
  totalVolume: number
  avgProfitPerMarket: number
}

const tradeSelect = {
  marketId: true,
  userId: true,
  side: true,
  amount: true,
  shares: true,
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
      outcomeType: trade.outcome.type,
    })
    tradesByMarket.set(trade.marketId, list)
  }

  return tradesByMarket
}

function toResolvedMarketProfit(
  market: SettledMarketRow & { winningOutcome: OutcomeType },
  tradesByMarket: Map<string, TradeForHouseProfit[]>
): AdminResolvedMarketProfit {
  const marketTrades = tradesByMarket.get(market.id) ?? []
  const profit = houseProfitIfResolved(marketTrades, market.winningOutcome)

  return {
    id: market.id,
    slug: market.slug,
    title: market.title,
    category: market.category,
    winningOutcome: market.winningOutcome,
    resolutionDate: market.resolutionDate.toISOString(),
    totalVolume: market.totalVolume,
    tradeCount: marketTrades.length,
    profit,
  }
}

export async function getAdminProfitSummary(): Promise<AdminProfitSummary> {
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

  const tradesByMarket = await loadTradesByMarketIds(
    settledWithOutcome.map((market) => market.id)
  )

  let totalProfit = 0
  let totalVolume = 0

  for (const market of settledWithOutcome) {
    const marketTrades = tradesByMarket.get(market.id) ?? []
    totalProfit += houseProfitIfResolved(marketTrades, market.winningOutcome)
    totalVolume += market.totalVolume
  }

  const settledCount = settledWithOutcome.length

  return {
    totalProfit,
    settledCount,
    pendingDecisionCount,
    totalVolume,
    avgProfitPerMarket: settledCount > 0 ? totalProfit / settledCount : 0,
  }
}

export async function listAdminResolvedMarketProfits(
  options: AdminPaginationInput
): Promise<AdminPaginatedResult<AdminResolvedMarketProfit>> {
  noStore()

  const where = {
    status: MarketStatus.resolved,
    winningOutcome: { not: null },
  } satisfies Prisma.PredictionMarketWhereInput

  const totalCount = await prisma.predictionMarket.count({ where })
  const { page, pageSize, totalPages, skip, take } = resolveAdminPagination(
    totalCount,
    options
  )

  if (totalCount === 0) {
    return { items: [], totalCount, page, pageSize, totalPages }
  }

  const markets = await prisma.predictionMarket.findMany({
    where,
    orderBy: { resolutionDate: "desc" },
    select: settledMarketSelect,
    skip,
    take,
  })

  const settledWithOutcome = markets.filter(
    (market): market is SettledMarketRow & { winningOutcome: OutcomeType } =>
      market.winningOutcome != null
  )

  const tradesByMarket = await loadTradesByMarketIds(
    settledWithOutcome.map((market) => market.id)
  )

  const items = settledWithOutcome.map((market) =>
    toResolvedMarketProfit(market, tradesByMarket)
  )

  return { items, totalCount, page, pageSize, totalPages }
}

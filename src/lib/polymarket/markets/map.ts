import { OutcomeType, type MarketCategory, type MarketStatus } from "@/lib/polymarket/db-types"

import { marketImageSrc } from "./images"

export type MarketCardOutcome = {
  type: OutcomeType
  currentPrice: number
}

export type MarketListItem = {
  id: string
  slug: string
  title: string
  category: MarketCategory
  status: MarketStatus
  volume: number
  liquidity: number
  probability: number
  trendingScore: number
  createdAt: string
  endDate: string
  iconLabel: string | null
  yesPrice: number
  noPrice: number
  imageUrl: string | null
  changePercent: number
}

export type MarketCardSource = {
  id: string
  slug: string
  title: string
  category: MarketCategory
  status: MarketStatus
  totalVolume: number
  liquidity: number
  trendingScore: number
  iconLabel: string | null
  imageMimeType: string | null
  resolutionDate: Date
  createdAt: Date
  outcomes: MarketCardOutcome[]
  priceHistory: { probability: number }[]
}

export function yesPriceOf(outcomes: MarketCardOutcome[]): number {
  return (
    outcomes.find((outcome) => outcome.type === OutcomeType.YES)?.currentPrice ??
    0
  )
}

export function noPriceOf(outcomes: MarketCardOutcome[]): number {
  return (
    outcomes.find((outcome) => outcome.type === OutcomeType.NO)?.currentPrice ??
    1 - yesPriceOf(outcomes)
  )
}

export function changePercentOf(
  current: number,
  history: { probability: number }[]
): number {
  const start = history[0]?.probability
  if (start === undefined) {
    return 0
  }
  return Number(((current - start) * 100).toFixed(1))
}

export function toMarketListItem(market: MarketCardSource): MarketListItem {
  const yesPrice = yesPriceOf(market.outcomes)
  const noPrice = noPriceOf(market.outcomes)
  return {
    id: market.id,
    slug: market.slug,
    title: market.title,
    category: market.category,
    status: market.status,
    volume: market.totalVolume,
    liquidity: market.liquidity,
    probability: yesPrice,
    trendingScore: market.trendingScore,
    createdAt: market.createdAt.toISOString(),
    endDate: market.resolutionDate.toISOString(),
    iconLabel: market.iconLabel,
    yesPrice,
    noPrice,
    imageUrl: market.imageMimeType ? marketImageSrc(market.id) : null,
    changePercent: changePercentOf(yesPrice, market.priceHistory),
  }
}

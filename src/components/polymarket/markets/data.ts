import {
  MarketCategory,
  type MarketStatus,
} from "@/lib/polymarket/db-types"

import type { MarketListItem } from "@/lib/polymarket/markets/map"

export type { MarketCategory, MarketStatus }
export type { MarketListItem }
export type Market = MarketListItem

export type MarketCategoryFilter = "all" | MarketCategory

export type MarketStatusFilter = MarketStatus | "all"

export type MarketSort =
  | "volume"
  | "trending"
  | "new"
  | "endingSoon"
  | "liquidity"

export const MARKET_CATEGORIES: MarketCategoryFilter[] = [
  "all",
  MarketCategory.politics,
  MarketCategory.crypto,
  MarketCategory.sports,
  MarketCategory.finance,
  MarketCategory.tech,
  MarketCategory.entertainment,
  MarketCategory.world,
  MarketCategory.commodities,
]

export const MARKET_SORTS: MarketSort[] = [
  "volume",
  "trending",
  "new",
  "endingSoon",
  "liquidity",
]

export const MARKET_STATUS_FILTERS: MarketStatusFilter[] = [
  "open",
  "resolved",
  "all",
]

export type MarketsFilterState = {
  category: MarketCategoryFilter
  status: MarketStatusFilter
  sort: MarketSort
  search: string
}

export function formatUsdVolume(volume: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(volume)
}

/** Wallet / trade amounts shown with dollar sign (matches trade panel). */
export function formatBalance(balance: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance)
}

export function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000) {
    return `R ${(volume / 1_000_000_000).toFixed(2)}B`
  }
  if (volume >= 1_000_000) {
    return `R ${(volume / 1_000_000).toFixed(2)}M`
  }
  if (volume >= 1_000) {
    return `R ${(volume / 1_000).toFixed(1)}K`
  }
  return `R ${Math.round(volume)}`
}

export function formatProbabilityPercent(probability: number): number {
  return Math.round(probability * 100)
}

export function formatPricePercent(price: number): string {
  return `${formatProbabilityPercent(price)}%`
}

export function formatCents(price: number): string {
  return `${Math.round(price * 100)}¢`
}

export function formatTimeLeft(
  endDate: string,
  now: Date = new Date()
): string {
  const ms = new Date(endDate).getTime() - now.getTime()
  if (ms <= 0) {
    return "Ended"
  }
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24))
  if (days === 1) {
    return "1d left"
  }
  return `${days}d left`
}

export function categoryTag(category: MarketCategory): string {
  return category.toUpperCase()
}

export function filterAndSortMarkets(
  markets: MarketListItem[],
  { category, status, sort, search }: MarketsFilterState
): MarketListItem[] {
  const query = search.trim().toLowerCase()

  const filtered = markets.filter((market) => {
    if (category !== "all" && market.category !== category) {
      return false
    }
    if (status !== "all" && market.status !== status) {
      return false
    }
    if (query && !market.title.toLowerCase().includes(query)) {
      return false
    }
    return true
  })

  return [...filtered].sort((a, b) => {
    switch (sort) {
      case "volume":
        return b.volume - a.volume
      case "trending":
        return b.trendingScore - a.trendingScore
      case "new":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      case "endingSoon":
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
      case "liquidity":
        return b.liquidity - a.liquidity
      default:
        return 0
    }
  })
}

export function summarizeMarkets(markets: MarketListItem[]) {
  const volume = markets.reduce((sum, market) => sum + market.volume, 0)
  return {
    count: markets.length,
    volume: formatVolume(volume),
  }
}

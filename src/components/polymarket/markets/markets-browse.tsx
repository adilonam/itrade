"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"

import { SectionShell } from "@/components/polymarket/landing/section-shell"
import { usePathname, useRouter } from "@/lib/polymarket/routing"

import {
  filterAndSortMarkets,
  summarizeMarkets,
  type MarketCategoryFilter,
  type MarketSort,
  type MarketStatusFilter,
  type MarketListItem,
  type MarketsFilterState,
} from "./data"
import { MarketCard } from "./market-card"
import { MarketsFilters } from "./markets-filters"
import { MarketsHeader } from "./markets-header"
import {
  DEFAULT_SORT,
  marketsFiltersToQuery,
  parseMarketsSearchParams,
} from "./params"

const SEARCH_DEBOUNCE_MS = 250

export function MarketsBrowse({
  markets: allMarkets,
  updatedAt,
}: {
  markets: MarketListItem[]
  updatedAt: string
}) {
  const t = useTranslations("Markets")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const filters = useMemo(
    () => parseMarketsSearchParams(searchParams),
    [searchParams]
  )

  const [searchInput, setSearchInput] = useState(filters.search)

  useEffect(() => {
    setSearchInput(filters.search)
  }, [filters.search])

  const replaceFilters = useCallback(
    (patch: Partial<MarketsFilterState>) => {
      const next: MarketsFilterState = { ...filters, ...patch }
      const query = marketsFiltersToQuery(next)

      // Keep explicit `sort=volume` (SubNav topVolume) when sort is unchanged.
      if (
        next.sort === DEFAULT_SORT &&
        searchParams.get("sort") === "volume" &&
        patch.sort === undefined
      ) {
        query.sort = "volume"
      }

      const qs = new URLSearchParams(query).toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname)
    },
    [filters, pathname, router, searchParams]
  )

  useEffect(() => {
    if (searchInput === filters.search) {
      return
    }
    const id = window.setTimeout(() => {
      replaceFilters({ search: searchInput })
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [searchInput, filters.search, replaceFilters])

  const markets = useMemo(
    () =>
      filterAndSortMarkets(allMarkets, {
        category: filters.category,
        status: filters.status,
        sort: filters.sort,
        search: filters.search,
      }),
    [allMarkets, filters.category, filters.status, filters.sort, filters.search]
  )

  const summary = useMemo(() => summarizeMarkets(markets), [markets])

  const onCategoryChange = useCallback(
    (category: MarketCategoryFilter) => {
      replaceFilters({ category })
    },
    [replaceFilters]
  )

  const onSortChange = useCallback(
    (sort: MarketSort) => {
      replaceFilters({ sort })
    },
    [replaceFilters]
  )

  const onStatusChange = useCallback(
    (status: MarketStatusFilter) => {
      replaceFilters({ status })
    },
    [replaceFilters]
  )

  return (
    <>
      <MarketsHeader
        count={summary.count}
        volume={summary.volume}
        search={searchInput}
        onSearchChange={setSearchInput}
        updatedAt={updatedAt}
      />
      <SectionShell className="pb-24">
        <MarketsFilters
          activeCategory={filters.category}
          activeSort={filters.sort}
          activeStatus={filters.status}
          onCategoryChange={onCategoryChange}
          onSortChange={onSortChange}
          onStatusChange={onStatusChange}
        />
        {markets.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {markets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        ) : (
          <p className="text-on-surface-variant dark:text-secondary-fixed-dim font-label text-body-sm py-12 text-center">
            {t("empty")}
          </p>
        )}
      </SectionShell>
    </>
  )
}

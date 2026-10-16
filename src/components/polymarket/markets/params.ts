import {
  MARKET_CATEGORIES,
  MARKET_SORTS,
  MARKET_STATUS_FILTERS,
  type MarketCategoryFilter,
  type MarketSort,
  type MarketStatusFilter,
  type MarketsFilterState,
} from "./data"

export const DEFAULT_CATEGORY: MarketCategoryFilter = "all"
export const DEFAULT_SORT: MarketSort = "volume"
export const DEFAULT_STATUS: MarketStatusFilter = "open"

export type SubNavFilterKey =
  | "all"
  | "trending"
  | "new"
  | "endingSoon"
  | "topVolume"

const CATEGORY_SET = new Set<string>(MARKET_CATEGORIES)
const SORT_SET = new Set<string>(MARKET_SORTS)
const STATUS_SET = new Set<string>(MARKET_STATUS_FILTERS)

export function parseCategoryParam(
  value: string | null
): MarketCategoryFilter {
  if (value && CATEGORY_SET.has(value)) {
    return value as MarketCategoryFilter
  }
  return DEFAULT_CATEGORY
}

export function parseSortParam(value: string | null): MarketSort {
  if (value && SORT_SET.has(value)) {
    return value as MarketSort
  }
  return DEFAULT_SORT
}

export function parseStatusParam(value: string | null): MarketStatusFilter {
  if (value && STATUS_SET.has(value)) {
    return value as MarketStatusFilter
  }
  return DEFAULT_STATUS
}

export function parseMarketsSearchParams(
  searchParams: URLSearchParams | ReadonlyURLSearchParams
): MarketsFilterState {
  return {
    category: parseCategoryParam(searchParams.get("category")),
    sort: parseSortParam(searchParams.get("sort")),
    status: parseStatusParam(searchParams.get("status")),
    search: searchParams.get("q")?.trim() ?? "",
  }
}

/** Query object for next-intl Link / router — omits defaults for clean URLs. */
export function marketsFiltersToQuery(
  state: MarketsFilterState
): Record<string, string> {
  const query: Record<string, string> = {}

  if (state.category !== DEFAULT_CATEGORY) {
    query.category = state.category
  }
  if (state.sort !== DEFAULT_SORT) {
    query.sort = state.sort
  }
  if (state.status !== DEFAULT_STATUS) {
    query.status = state.status
  }
  const q = state.search.trim()
  if (q) {
    query.q = q
  }

  return query
}

export function marketsHref(state: MarketsFilterState = {
  category: DEFAULT_CATEGORY,
  sort: DEFAULT_SORT,
  status: DEFAULT_STATUS,
  search: "",
}): { pathname: "/markets"; query?: Record<string, string> } {
  const query = marketsFiltersToQuery(state)
  if (Object.keys(query).length === 0) {
    return { pathname: "/markets" }
  }
  return { pathname: "/markets", query }
}

/**
 * SubNav filter → markets URL state.
 * Clears category to `all` so the nav sort filters browse across categories.
 */
export function subNavFilterToState(
  key: SubNavFilterKey
): MarketsFilterState {
  const base: MarketsFilterState = {
    category: DEFAULT_CATEGORY,
    sort: DEFAULT_SORT,
    status: DEFAULT_STATUS,
    search: "",
  }

  switch (key) {
    case "all":
      return base
    case "trending":
      return { ...base, sort: "trending" }
    case "new":
      return { ...base, sort: "new" }
    case "endingSoon":
      return { ...base, sort: "endingSoon" }
    case "topVolume":
      // Explicit sort=volume so it differs from "all" (no sort param).
      return { ...base, sort: "volume" }
  }
}

export function subNavFilterHref(key: SubNavFilterKey): {
  pathname: "/markets"
  query?: Record<string, string>
} {
  if (key === "all") {
    return { pathname: "/markets" }
  }
  if (key === "topVolume") {
    return { pathname: "/markets", query: { sort: "volume" } }
  }
  return {
    pathname: "/markets",
    query: { sort: subNavFilterToState(key).sort },
  }
}

/**
 * Active SubNav key from markets search params.
 * - no `sort` → all
 * - sort=volume (explicit) → topVolume
 * - sort=trending|new|endingSoon → matching key
 * - sort=liquidity / other → all (no dedicated SubNav item)
 */
export function getActiveSubNavFilter(
  searchParams: URLSearchParams | ReadonlyURLSearchParams
): SubNavFilterKey {
  const sortParam = searchParams.get("sort")
  if (sortParam === null || sortParam === "") {
    return "all"
  }
  if (sortParam === "volume") {
    return "topVolume"
  }
  if (
    sortParam === "trending" ||
    sortParam === "new" ||
    sortParam === "endingSoon"
  ) {
    return sortParam
  }
  return "all"
}

export function categoryHref(
  category: MarketCategoryFilter,
  current?: Pick<MarketsFilterState, "sort" | "status" | "search"> & {
    /** Keep `sort=volume` in the URL (SubNav topVolume). */
    explicitVolume?: boolean
  }
): { pathname: "/markets"; query?: Record<string, string> } {
  const state: MarketsFilterState = {
    category,
    sort: current?.sort ?? DEFAULT_SORT,
    status: current?.status ?? DEFAULT_STATUS,
    search: current?.search ?? "",
  }
  const query = marketsFiltersToQuery(state)
  if (state.sort === DEFAULT_SORT && current?.explicitVolume) {
    query.sort = "volume"
  }
  if (Object.keys(query).length === 0) {
    return { pathname: "/markets" }
  }
  return { pathname: "/markets", query }
}

/** Minimal ReadonlyURLSearchParams shape used by Next.js. */
type ReadonlyURLSearchParams = {
  get(name: string): string | null
}

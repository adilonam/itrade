"use client"

import {
  BarChart3,
  Clock,
  Flame,
  Sparkles,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { Link, usePathname } from "@/lib/polymarket/routing"

import {
  categoryHref,
  getActiveSubNavFilter,
  parseMarketsSearchParams,
  subNavFilterHref,
  type SubNavFilterKey,
} from "@/components/polymarket/markets/params"

const filterIcons = {
  local_fire_department: Flame,
  new_releases: Sparkles,
  timer: Clock,
  bar_chart: BarChart3,
} as const

const FILTERS = [
  { key: "all" as const },
  { key: "trending" as const, icon: "local_fire_department" as const },
  { key: "new" as const, icon: "new_releases" as const },
  { key: "endingSoon" as const, icon: "timer" as const },
  { key: "topVolume" as const, icon: "bar_chart" as const },
]

const CATEGORIES = [
  "politics",
  "crypto",
  "sports",
  "finance",
  "tech",
  "entertainment",
] as const

export type ActiveFilter = SubNavFilterKey

export function SubNav() {
  const t = useTranslations("SubNav")
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const onMarkets = pathname === "/markets"
  const activeFilter = onMarkets
    ? getActiveSubNavFilter(searchParams)
    : undefined
  const currentFilters = onMarkets
    ? parseMarketsSearchParams(searchParams)
    : undefined
  const activeCategory =
    onMarkets && currentFilters && currentFilters.category !== "all"
      ? currentFilters.category
      : undefined

  return (
    <div className="bg-surface-white dark:bg-on-secondary-fixed border-outline-variant dark:border-on-secondary-container hidden h-12 w-full items-center border-b md:flex">
      <div className="mx-auto flex h-full w-full max-w-(--spacing-container-max) items-center overflow-x-auto px-(--spacing-margin-mobile) md:px-(--spacing-margin-desktop)">
        <div className="text-body-sm text-secondary flex min-w-max items-center gap-4 whitespace-nowrap">
          {FILTERS.map((filter) => {
            const Icon =
              "icon" in filter
                ? filterIcons[filter.icon as keyof typeof filterIcons]
                : null
            const isActive = filter.key === activeFilter

            return (
              <Link
                key={filter.key}
                href={subNavFilterHref(filter.key)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-primary-container dark:bg-primary-fixed-dim rounded-full px-3 py-1 font-medium text-white dark:text-on-primary-fixed"
                    : "text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed-dim"
                )}
              >
                {Icon ? <Icon className="size-4 shrink-0" aria-hidden /> : null}
                <span>{t(filter.key)}</span>
              </Link>
            )
          })}

          <span
            aria-hidden
            className="bg-outline-variant mx-1 hidden h-4 w-px shrink-0 lg:block"
          />

          <div className="hidden items-center gap-4 lg:flex">
            {CATEGORIES.map((category) => {
              const isActive = category === activeCategory
              return (
                <Link
                  key={category}
                  href={categoryHref(
                    category,
                    currentFilters
                      ? {
                          sort: currentFilters.sort,
                          status: currentFilters.status,
                          search: currentFilters.search,
                          explicitVolume:
                            searchParams.get("sort") === "volume",
                        }
                      : undefined
                  )}
                  className={cn(
                    "shrink-0 transition-colors",
                    isActive
                      ? "text-primary dark:text-primary-fixed-dim font-medium"
                      : "hover:text-primary dark:hover:text-primary-fixed-dim"
                  )}
                >
                  {t(category)}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

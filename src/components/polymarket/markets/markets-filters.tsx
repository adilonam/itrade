"use client"

import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"

import {
  MARKET_CATEGORIES,
  MARKET_SORTS,
  MARKET_STATUS_FILTERS,
  type MarketCategoryFilter,
  type MarketSort,
  type MarketStatusFilter,
} from "./data"

type MarketsFiltersProps = {
  activeCategory: MarketCategoryFilter
  activeSort: MarketSort
  activeStatus: MarketStatusFilter
  onCategoryChange: (category: MarketCategoryFilter) => void
  onSortChange: (sort: MarketSort) => void
  onStatusChange: (status: MarketStatusFilter) => void
}

export function MarketsFilters({
  activeCategory,
  activeSort,
  activeStatus,
  onCategoryChange,
  onSortChange,
  onStatusChange,
}: MarketsFiltersProps) {
  const t = useTranslations("Markets")

  return (
    <div className="space-y-4 pb-8">
      <div className="flex flex-wrap gap-2">
        {MARKET_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onCategoryChange(category)}
            className={cn(
              "font-label text-body-sm rounded-full px-4 py-1.5 transition-colors",
              category === activeCategory
                ? "bg-primary-container text-white dark:bg-primary-fixed-dim dark:text-on-primary-fixed"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container dark:bg-surface-container-high/60 dark:text-secondary-fixed-dim dark:hover:bg-surface-container-high"
            )}
          >
            {t(`categories.${category}`)}
          </button>
        ))}
      </div>

      <div className="font-label text-body-sm text-on-surface-variant dark:text-secondary-fixed-dim flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-secondary font-medium">{t("sort.label")}</span>
          {MARKET_SORTS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onSortChange(key)}
              className={cn(
                "transition-colors",
                key === activeSort
                  ? "text-primary dark:text-primary-fixed-dim border-primary dark:border-primary-fixed-dim border-b-2 pb-0.5 font-medium"
                  : "hover:text-primary dark:hover:text-primary-fixed-dim"
              )}
            >
              {t(`sort.${key}`)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-secondary font-medium">{t("status.label")}</span>
          {MARKET_STATUS_FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onStatusChange(key)}
              className={cn(
                "transition-colors",
                key === activeStatus
                  ? "text-primary dark:text-primary-fixed-dim border-primary dark:border-primary-fixed-dim border-b-2 pb-0.5 font-medium"
                  : "hover:text-primary dark:hover:text-primary-fixed-dim"
              )}
            >
              {t(`status.${key}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

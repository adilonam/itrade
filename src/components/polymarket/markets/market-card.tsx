"use client"

import { BarChart3, Clock, TrendingDown, TrendingUp } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/lib/polymarket/routing"

import { MarketStatus } from "@/lib/polymarket/db-types"

import {
  categoryTag,
  formatPricePercent,
  formatProbabilityPercent,
  formatTimeLeft,
  formatVolume,
  type MarketListItem,
} from "./data"
import { MarketThumb } from "./market-thumb"

type MarketCardProps = {
  market: MarketListItem
}

export function MarketCard({ market }: MarketCardProps) {
  const t = useTranslations("Markets")
  const chance = formatProbabilityPercent(market.probability)
  const yesPrice = formatPricePercent(market.yesPrice ?? market.probability)
  const noPrice = formatPricePercent(market.noPrice ?? 1 - market.probability)
  const changePercent = market.changePercent ?? 0
  const positive = changePercent >= 0
  const trendLabel = `${positive ? "+" : ""}${changePercent.toFixed(1)}%`
  const iconLabel =
    market.iconLabel ?? market.category.slice(0, 2).toUpperCase()
  const href = `/markets/${market.slug}`
  const isOpen = market.status === MarketStatus.open

  return (
    <article className="bg-surface-white border-outline-variant hover:border-primary-container flex h-full flex-col rounded-xl border p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-colors dark:shadow-[0_4px_12px_rgba(0,0,0,0.25)] dark:hover:border-primary-fixed-dim">
      <Link href={href} className="mb-4 flex grow gap-3">
        <MarketThumb
          src={market.imageUrl}
          label={iconLabel}
          className="size-10 rounded-full"
        />
        <div className="min-w-0 grow">
          <h4 className="font-label text-body-sm text-on-surface line-clamp-3 font-semibold">
            {market.title}
          </h4>
        </div>
        <div className="shrink-0 text-end">
          <div className="font-headline text-headline-lg-mobile text-on-surface">
            {chance}%
          </div>
          <div className="text-secondary text-[10px] font-semibold uppercase">
            {isOpen ? t("chance") : t("status.resolved")}
          </div>
        </div>
      </Link>

      <div className="mb-4 flex gap-2">
        {isOpen ? (
          <>
            <Link
              href={`${href}?action=buy&outcome=YES`}
              className="font-label text-label-caps bg-success-green/10 text-success-green hover:bg-success-green/20 flex-1 rounded-lg px-2 py-2 text-center whitespace-nowrap transition-colors"
            >
              {t("buyYes")} - {yesPrice}
            </Link>
            <Link
              href={`${href}?action=buy&outcome=NO`}
              className="font-label text-label-caps bg-danger-red/10 text-danger-red hover:bg-danger-red/20 flex-1 rounded-lg px-2 py-2 text-center whitespace-nowrap transition-colors"
            >
              {t("buyNo")} - {noPrice}
            </Link>
          </>
        ) : (
          <Link
            href={href}
            className="font-label text-label-caps bg-surface-container text-on-surface-variant hover:bg-surface-container-high flex-1 rounded-lg px-2 py-2 text-center whitespace-nowrap transition-colors"
          >
            {t("viewSettled")} — Yes {yesPrice} · No {noPrice}
          </Link>
        )}
      </div>

      <div className="font-data text-data-mono text-secondary border-surface-variant mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t pt-3 text-[10px]">
        <span className="bg-surface-container font-label rounded px-2 py-1">
          {categoryTag(market.category)}
        </span>
        <span className="inline-flex items-center gap-1">
          <BarChart3 className="size-3 shrink-0" />
          {t("vol")} {formatVolume(market.volume)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3 shrink-0" />
          {formatTimeLeft(market.endDate)}
        </span>
        <span
          className={`ms-auto inline-flex items-center gap-0.5 ${positive ? "text-success-green" : "text-danger-red"}`}
        >
          {positive ? (
            <TrendingUp className="size-3" />
          ) : (
            <TrendingDown className="size-3" />
          )}
          {trendLabel}
        </span>
      </div>
    </article>
  )
}

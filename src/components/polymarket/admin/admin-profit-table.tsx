"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/lib/polymarket/routing"

import { Badge } from "@/components/polymarket/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/polymarket/ui/table"
import type { AdminResolvedMarketProfit } from "@/lib/polymarket/admin/profit-queries"
import { OutcomeType } from "@/lib/polymarket/db-types"
import { cn } from "@/lib/utils"

function formatMoney(value: number): string {
  const abs = Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return value < 0 ? `-$${abs}` : `$${abs}`
}

function formatDueAt(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  })
}

function formatCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1)
}

export function AdminProfitTable({
  markets,
}: {
  markets: AdminResolvedMarketProfit[]
}) {
  const t = useTranslations("Admin")

  if (markets.length === 0) {
    return (
      <div className="border-outline-variant bg-surface-container-low rounded-xl border px-6 py-12 text-center">
        <p className="text-on-surface font-medium">{t("profitEmptyTitle")}</p>
        <p className="text-on-surface-variant mt-1 text-sm">
          {t("profitEmptyDescription")}
        </p>
      </div>
    )
  }

  return (
    <div className="border-outline-variant overflow-hidden rounded-xl border">
      <Table>
        <TableHeader className="bg-surface-container-low border-outline-variant [&_tr]:border-outline-variant">
          <TableRow className="border-outline-variant hover:bg-transparent">
            <TableHead className="text-on-surface h-auto px-4 py-3 font-semibold">
              {t("profitColMarket")}
            </TableHead>
            <TableHead className="text-on-surface h-auto px-4 py-3 font-semibold">
              {t("profitColOutcome")}
            </TableHead>
            <TableHead className="text-on-surface hidden h-auto px-4 py-3 font-semibold md:table-cell">
              {t("profitColCategory")}
            </TableHead>
            <TableHead className="text-on-surface hidden h-auto px-4 py-3 font-semibold sm:table-cell">
              {t("profitColResolvedAt")}
            </TableHead>
            <TableHead className="text-on-surface hidden h-auto px-4 py-3 font-semibold lg:table-cell">
              {t("profitColVolume")}
            </TableHead>
            <TableHead className="text-on-surface hidden h-auto px-4 py-3 font-semibold lg:table-cell">
              {t("profitColTrades")}
            </TableHead>
            <TableHead className="text-on-surface h-auto px-4 py-3 text-right font-semibold">
              {t("profitColProfit")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {markets.map((market) => (
            <TableRow
              key={`${market.balanceType}:${market.id}`}
              className="border-outline-variant hover:bg-transparent"
            >
              <TableCell className="px-4 py-3 whitespace-normal">
                <Link
                  href={`/markets/${market.slug}`}
                  className="text-on-surface hover:text-primary font-medium transition-colors"
                >
                  {market.title}
                </Link>
                <p className="text-on-surface-variant mt-0.5 text-xs">
                  {market.slug}
                </p>
              </TableCell>
              <TableCell className="px-4 py-3">
                <Badge
                  variant="outline"
                  className={cn(
                    market.winningOutcome === OutcomeType.YES
                      ? "border-success-green/40 bg-success-green/15 text-success-green dark:border-success-green/50 dark:bg-success-green/20"
                      : "border-danger-red/40 bg-danger-red/15 text-danger-red dark:border-danger-red/50 dark:bg-danger-red/20"
                  )}
                >
                  {market.winningOutcome === OutcomeType.YES
                    ? t("profitYes")
                    : t("profitNo")}
                </Badge>
              </TableCell>
              <TableCell className="text-on-surface-variant hidden px-4 py-3 md:table-cell">
                {formatCategory(market.category)}
              </TableCell>
              <TableCell className="text-on-surface-variant hidden px-4 py-3 whitespace-nowrap sm:table-cell">
                <time dateTime={market.resolutionDate} suppressHydrationWarning>
                  {formatDueAt(market.resolutionDate)}
                </time>
              </TableCell>
              <TableCell className="text-on-surface-variant hidden px-4 py-3 tabular-nums lg:table-cell">
                {formatMoney(market.volume)}
              </TableCell>
              <TableCell className="text-on-surface-variant hidden px-4 py-3 tabular-nums lg:table-cell">
                {market.tradeCount.toLocaleString()}
              </TableCell>
              <TableCell className="px-4 py-3 text-right">
                <span
                  className={cn(
                    "font-data text-sm font-medium tabular-nums",
                    market.profit > 0
                      ? "text-success-green"
                      : market.profit < 0
                        ? "text-danger-red"
                        : "text-on-surface-variant"
                  )}
                >
                  {formatMoney(market.profit)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

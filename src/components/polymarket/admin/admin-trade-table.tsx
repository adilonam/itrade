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
import type { AdminTradeListItem } from "@/lib/polymarket/markets/queries"
import { cn } from "@/lib/utils"

function formatMoney(value: number): string {
  const abs = Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return value < 0 ? `-$${abs}` : `$${abs}`
}

function formatShares(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })
}

function formatPrice(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })
}

function formatTime(iso: string): string {
  // Fixed locale + UTC so SSR and client produce the same string (avoids hydration mismatch).
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  })
}

function userLabel(user: AdminTradeListItem["user"]): string {
  return user.name?.trim() || user.username?.trim() || user.email
}

export function AdminTradeTable({ trades }: { trades: AdminTradeListItem[] }) {
  const t = useTranslations("Admin")

  if (trades.length === 0) {
    return (
      <div className="border-outline-variant bg-surface-container-low rounded-xl border px-6 py-12 text-center">
        <p className="text-on-surface font-medium">{t("tradesEmptyTitle")}</p>
        <p className="text-on-surface-variant mt-1 text-sm">
          {t("tradesEmptyDescription")}
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
              {t("tradesColTime")}
            </TableHead>
            <TableHead className="text-on-surface h-auto px-4 py-3 font-semibold">
              {t("tradesColUser")}
            </TableHead>
            <TableHead className="text-on-surface hidden h-auto px-4 py-3 font-semibold md:table-cell">
              {t("tradesColMarket")}
            </TableHead>
            <TableHead className="text-on-surface h-auto px-4 py-3 font-semibold">
              {t("tradesColBalance")}
            </TableHead>
            <TableHead className="text-on-surface h-auto px-4 py-3 font-semibold">
              {t("tradesColSide")}
            </TableHead>
            <TableHead className="text-on-surface h-auto px-4 py-3 font-semibold">
              {t("tradesColOutcome")}
            </TableHead>
            <TableHead className="text-on-surface hidden h-auto px-4 py-3 font-semibold sm:table-cell">
              {t("tradesColAmount")}
            </TableHead>
            <TableHead className="text-on-surface hidden h-auto px-4 py-3 font-semibold lg:table-cell">
              {t("tradesColShares")}
            </TableHead>
            <TableHead className="text-on-surface hidden h-auto px-4 py-3 font-semibold lg:table-cell">
              {t("tradesColPrice")}
            </TableHead>
            <TableHead className="text-on-surface hidden h-auto px-4 py-3 text-right font-semibold xl:table-cell">
              {t("tradesColProfit")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => (
            <TableRow
              key={trade.id}
              className="border-outline-variant hover:bg-transparent"
            >
              <TableCell className="text-on-surface-variant px-4 py-3 whitespace-nowrap">
                <time dateTime={trade.createdAt} suppressHydrationWarning>
                  {formatTime(trade.createdAt)}
                </time>
              </TableCell>
              <TableCell className="px-4 py-3 whitespace-normal">
                <p className="max-w-[12rem] truncate font-medium">
                  {userLabel(trade.user)}
                </p>
                <p className="text-on-surface-variant mt-0.5 max-w-[12rem] truncate text-xs">
                  {trade.user.email}
                  {trade.user.username ? ` · @${trade.user.username}` : null}
                </p>
              </TableCell>
              <TableCell className="hidden px-4 py-3 whitespace-normal md:table-cell">
                <Link
                  href={`/markets/${trade.market.slug}`}
                  className="hover:text-primary line-clamp-2 max-w-xs font-medium hover:underline"
                >
                  {trade.market.title}
                </Link>
              </TableCell>
              <TableCell className="px-4 py-3 whitespace-normal">
                <Badge
                  variant="outline"
                  className={cn(
                    trade.balanceType === "REAL"
                      ? "border-primary/40 bg-primary/15 text-primary dark:text-primary-fixed-dim"
                      : "border-tertiary/40 bg-tertiary/15 text-tertiary dark:text-tertiary-fixed-dim"
                  )}
                >
                  {trade.balanceType === "REAL"
                    ? t("tradesBalanceReal")
                    : t("tradesBalanceDemo")}
                </Badge>
              </TableCell>
              <TableCell className="px-4 py-3 whitespace-normal">
                <Badge
                  variant="outline"
                  className={cn(
                    trade.side === "BUY"
                      ? "border-success-green/40 bg-success-green/15 text-success-green"
                      : "border-danger-red/40 bg-danger-red/15 text-danger-red"
                  )}
                >
                  {trade.side}
                </Badge>
              </TableCell>
              <TableCell className="px-4 py-3 whitespace-normal">
                <Badge variant="outline">{trade.outcome.type}</Badge>
              </TableCell>
              <TableCell className="font-data hidden px-4 py-3 tabular-nums sm:table-cell">
                {formatMoney(trade.amount)}
              </TableCell>
              <TableCell className="font-data text-on-surface-variant hidden px-4 py-3 tabular-nums lg:table-cell">
                {formatShares(trade.shares)}
              </TableCell>
              <TableCell className="font-data text-on-surface-variant hidden px-4 py-3 tabular-nums lg:table-cell">
                {formatPrice(trade.priceAtTrade)}
              </TableCell>
              <TableCell
                className={cn(
                  "font-data hidden px-4 py-3 text-right tabular-nums xl:table-cell",
                  trade.balanceImpact != null && trade.balanceImpact < 0
                    ? "text-danger-red"
                    : "text-on-surface-variant"
                )}
              >
                {trade.balanceImpact != null
                  ? formatMoney(trade.balanceImpact)
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

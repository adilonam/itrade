import { getTranslations } from "next-intl/server"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/polymarket/ui/card"
import type { AdminProfitSummary } from "@/lib/polymarket/admin/profit-queries"
import { cn } from "@/lib/utils"

function formatMoney(value: number): string {
  const abs = Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return value < 0 ? `-$${abs}` : `$${abs}`
}

type AdminProfitSummaryProps = {
  summary: AdminProfitSummary
}

export async function AdminProfitSummaryCards({
  summary,
}: AdminProfitSummaryProps) {
  const t = await getTranslations("Admin")

  const cards = [
    {
      key: "totalProfit",
      title: t("profitSummaryTotal"),
      value: formatMoney(summary.totalProfit),
      description: t("profitSummaryTotalDescription"),
      valueClassName:
        summary.totalProfit > 0
          ? "text-success-green"
          : summary.totalProfit < 0
            ? "text-danger-red"
            : "text-on-surface",
    },
    {
      key: "settledCount",
      title: t("profitSummarySettled"),
      value: summary.settledCount.toLocaleString(),
      description: t("profitSummarySettledDescription"),
      valueClassName: "text-on-surface",
    },
    {
      key: "avgProfit",
      title: t("profitSummaryAverage"),
      value: formatMoney(summary.avgProfitPerMarket),
      description: t("profitSummaryAverageDescription"),
      valueClassName:
        summary.avgProfitPerMarket > 0
          ? "text-success-green"
          : summary.avgProfitPerMarket < 0
            ? "text-danger-red"
            : "text-on-surface",
    },
    {
      key: "volume",
      title: t("profitSummaryVolume"),
      value: formatMoney(summary.totalVolume),
      description: t("profitSummaryVolumeDescription"),
      valueClassName: "text-on-surface",
    },
  ] as const

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.key}
          className="border-outline-variant bg-surface-container-low rounded-xl shadow-none ring-0"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-on-surface-variant text-sm font-medium">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p
              className={cn(
                "font-heading text-2xl font-semibold tabular-nums",
                card.valueClassName
              )}
            >
              {card.value}
            </p>
            <CardDescription>{card.description}</CardDescription>
          </CardContent>
        </Card>
      ))}
      {summary.pendingDecisionCount > 0 ? (
        <p className="text-on-surface-variant sm:col-span-2 xl:col-span-4 text-sm">
          {t("profitSummaryPending", { count: summary.pendingDecisionCount })}
        </p>
      ) : null}
    </div>
  )
}

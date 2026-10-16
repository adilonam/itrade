"use client"

import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Link, useRouter } from "@/lib/polymarket/routing"

import { buttonVariants } from "@/components/polymarket/ui/button"
import { ADMIN_PAGE_SIZE_DEFAULT } from "@/lib/polymarket/admin/pagination"
import type { AdminMarketOption } from "@/lib/polymarket/markets/queries"
import { cn } from "@/lib/utils"

type AdminTradesFilterProps = {
  markets: AdminMarketOption[]
  selectedMarket: AdminMarketOption | null
}

export function AdminTradesFilter({
  markets,
  selectedMarket,
}: AdminTradesFilterProps) {
  const t = useTranslations("Admin")
  const router = useRouter()
  const searchParams = useSearchParams()

  function hrefForMarket(marketId?: string) {
    const params = new URLSearchParams()
    if (marketId) {
      params.set("marketId", marketId)
    }
    const pageSize = searchParams.get("pageSize")
    if (pageSize && pageSize !== String(ADMIN_PAGE_SIZE_DEFAULT)) {
      params.set("pageSize", pageSize)
    }
    const qs = params.toString()
    return qs ? `/admin/trades?${qs}` : "/admin/trades"
  }

  return (
    <div className="border-outline-variant bg-surface-container-low flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {selectedMarket ? (
          <p className="text-sm">
            <span className="text-on-surface-variant">{t("tradesFilterLabel")} </span>
            <span className="font-medium">{selectedMarket.title}</span>
          </p>
        ) : (
          <p className="text-on-surface-variant text-sm">
            {t("tradesFilterAll")}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="admin-trades-market">
          {t("tradesFilterSelect")}
        </label>
        <select
          id="admin-trades-market"
          className={cn(
            "border-outline-variant bg-surface text-on-surface h-8 max-w-xs rounded-2xl border px-3 text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/30 outline-none focus-visible:ring-3"
          )}
          value={selectedMarket?.id ?? ""}
          onChange={(event) => {
            const value = event.target.value
            router.push(hrefForMarket(value || undefined))
          }}
        >
          <option value="">{t("tradesFilterSelectAll")}</option>
          {markets.map((market) => (
            <option key={market.id} value={market.id}>
              {market.title}
            </option>
          ))}
        </select>

        {selectedMarket ? (
          <Link
            href={hrefForMarket()}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t("tradesClearFilter")}
          </Link>
        ) : null}
      </div>
    </div>
  )
}

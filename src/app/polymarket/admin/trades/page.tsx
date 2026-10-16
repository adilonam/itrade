import { getTranslations } from "next-intl/server"

import { AdminPageShell } from "@/components/polymarket/admin/admin-page-shell"
import { AdminPagination } from "@/components/polymarket/admin/admin-pagination"
import { AdminTradeTable } from "@/components/polymarket/admin/admin-trade-table"
import { AdminTradesFilter } from "@/components/polymarket/admin/admin-trades-filter"
import { Header } from "@/components/polymarket/landing/header"
import { parseAdminPagination } from "@/lib/polymarket/admin/pagination"
import {
  getAdminMarketById,
  listAdminMarketOptions,
  listAdminTrades,
} from "@/lib/polymarket/markets/queries"

type PageProps = {
  searchParams: Promise<{
    marketId?: string
    page?: string
    pageSize?: string
  }>
}

export default async function AdminTradesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const marketId =
    typeof params.marketId === "string" && params.marketId.length > 0
      ? params.marketId
      : undefined
  const pagination = parseAdminPagination(params)

  const [t, result, markets, selectedMarket] = await Promise.all([
    getTranslations("Admin"),
    listAdminTrades({ marketId, ...pagination }),
    listAdminMarketOptions(),
    marketId ? getAdminMarketById(marketId) : Promise.resolve(null),
  ])

  return (
    <>
      <Header activeNav="tradesAdmin" />
      <AdminPageShell>
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {t("tradesTitle")}
          </h1>
          <p className="text-on-surface-variant max-w-2xl text-sm">
            {t("tradesDescription")}
          </p>
        </div>
        <div className="mt-6 space-y-4">
          <AdminTradesFilter
            markets={markets}
            selectedMarket={selectedMarket}
          />
          <AdminTradeTable trades={result.items} />
          <AdminPagination
            pathname="/admin/trades"
            page={result.page}
            totalPages={result.totalPages}
            pageSize={result.pageSize}
            totalCount={result.totalCount}
            params={{ marketId }}
          />
        </div>
      </AdminPageShell>
    </>
  )
}

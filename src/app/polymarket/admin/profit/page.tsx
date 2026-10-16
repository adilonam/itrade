import { getTranslations } from "next-intl/server"

import { AdminPageShell } from "@/components/polymarket/admin/admin-page-shell"
import { AdminPagination } from "@/components/polymarket/admin/admin-pagination"
import { AdminProfitSummaryCards } from "@/components/polymarket/admin/admin-profit-summary"
import { AdminProfitTable } from "@/components/polymarket/admin/admin-profit-table"
import { Header } from "@/components/polymarket/landing/header"
import { parseAdminPagination } from "@/lib/polymarket/admin/pagination"
import {
  getAdminProfitSummary,
  listAdminResolvedMarketProfits,
} from "@/lib/polymarket/admin/profit-queries"

type PageProps = {
  searchParams: Promise<{ page?: string; pageSize?: string }>
}

export default async function AdminProfitPage({ searchParams }: PageProps) {
  const params = await searchParams
  const pagination = parseAdminPagination(params)

  const [t, summary, result] = await Promise.all([
    getTranslations("Admin"),
    getAdminProfitSummary(),
    listAdminResolvedMarketProfits(pagination),
  ])

  return (
    <>
      <Header activeNav="profitAdmin" />
      <AdminPageShell>
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {t("profitTitle")}
          </h1>
          <p className="text-on-surface-variant max-w-2xl text-sm">
            {t("profitDescription")}
          </p>
        </div>

        <div className="mt-8 space-y-8">
          <AdminProfitSummaryCards summary={summary} />
          <div className="space-y-4">
            <h2 className="text-on-surface font-heading text-lg font-semibold">
              {t("profitTableHeading")}
            </h2>
            <AdminProfitTable markets={result.items} />
            <AdminPagination
              pathname="/admin/profit"
              page={result.page}
              totalPages={result.totalPages}
              pageSize={result.pageSize}
              totalCount={result.totalCount}
            />
          </div>
        </div>
      </AdminPageShell>
    </>
  )
}

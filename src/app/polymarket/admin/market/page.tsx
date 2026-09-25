import { getTranslations } from "next-intl/server"

import { AdminMarketTable } from "@/components/polymarket/admin/admin-market-table"
import { AdminMarketsSearch } from "@/components/polymarket/admin/admin-markets-search"
import { AdminPageShell } from "@/components/polymarket/admin/admin-page-shell"
import { AdminPagination } from "@/components/polymarket/admin/admin-pagination"
import { Header } from "@/components/polymarket/landing/header"
import { parseAdminPagination } from "@/lib/polymarket/admin/pagination"
import { listAdminMarkets } from "@/lib/polymarket/markets/queries"

type PageProps = {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>
}

export default async function AdminMarketPage({ searchParams }: PageProps) {
  const params = await searchParams
  const query =
    typeof params.q === "string" && params.q.trim().length > 0
      ? params.q.trim()
      : ""
  const pagination = parseAdminPagination(params)

  const [t, result] = await Promise.all([
    getTranslations("Admin"),
    listAdminMarkets({ q: query || undefined, ...pagination }),
  ])

  return (
    <>
      <Header activeNav="marketsAdmin" />
      <AdminPageShell>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("marketsTitle")}
        </h1>
        <div className="mt-6 space-y-4">
          <AdminMarketsSearch query={query} />
          <AdminMarketTable markets={result.items} searchQuery={query} />
          <AdminPagination
            pathname="/admin/market"
            page={result.page}
            totalPages={result.totalPages}
            pageSize={result.pageSize}
            totalCount={result.totalCount}
            params={{ q: query || undefined }}
          />
        </div>
      </AdminPageShell>
    </>
  )
}

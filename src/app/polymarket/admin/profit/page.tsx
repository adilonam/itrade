import { getTranslations } from "next-intl/server"

import { AdminPageShell } from "@/components/polymarket/admin/admin-page-shell"
import { AdminPagination } from "@/components/polymarket/admin/admin-pagination"
import { AdminProfitSummaryCards } from "@/components/polymarket/admin/admin-profit-summary"
import { AdminProfitTable } from "@/components/polymarket/admin/admin-profit-table"
import { Header } from "@/components/polymarket/landing/header"
import {
  ADMIN_PAGE_SIZE_DEFAULT,
  parseAdminPagination,
} from "@/lib/polymarket/admin/pagination"
import {
  getAdminProfitOverview,
  listAdminResolvedMarketProfitsForBalance,
} from "@/lib/polymarket/admin/profit-queries"
import { cn } from "@/lib/utils"

type PageProps = {
  searchParams: Promise<{
    realPage?: string
    demoPage?: string
    pageSize?: string
  }>
}

function parseSectionPage(value: string | undefined): number {
  if (!value) return 1
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  return parsed
}

export default async function AdminProfitPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { pageSize } = parseAdminPagination({
    page: "1",
    pageSize: params.pageSize,
  })
  const realPage = parseSectionPage(params.realPage)
  const demoPage = parseSectionPage(params.demoPage)

  const [t, overview, realResult, demoResult] = await Promise.all([
    getTranslations("Admin"),
    getAdminProfitOverview(),
    listAdminResolvedMarketProfitsForBalance("REAL", {
      page: realPage,
      pageSize,
    }),
    listAdminResolvedMarketProfitsForBalance("DEMO", {
      page: demoPage,
      pageSize,
    }),
  ])

  const sharedParams = {
    pageSize:
      pageSize !== ADMIN_PAGE_SIZE_DEFAULT ? String(pageSize) : undefined,
  }

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

        <div className="mt-8 space-y-10">
          <section
            aria-labelledby="profit-real-heading"
            className="border-outline-variant bg-surface-container-low/40 space-y-6 rounded-2xl border p-4 sm:p-6"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="profit-real-heading"
                  className="text-on-surface font-heading text-xl font-semibold"
                >
                  {t("profitSectionReal")}
                </h2>
                <span className="border-primary/40 bg-primary/15 text-primary dark:text-primary-fixed-dim rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                  {t("tradesBalanceReal")}
                </span>
              </div>
              <p className="text-on-surface-variant text-sm">
                {t("profitSectionRealDescription")}
              </p>
            </div>

            <AdminProfitSummaryCards
              summary={overview.real}
              pendingDecisionCount={overview.pendingDecisionCount}
            />

            <div className="space-y-4">
              <h3 className="text-on-surface font-heading text-base font-semibold">
                {t("profitTableHeading")}
              </h3>
              <AdminProfitTable markets={realResult.items} />
              <AdminPagination
                pathname="/admin/profit"
                page={realResult.page}
                totalPages={realResult.totalPages}
                pageSize={realResult.pageSize}
                totalCount={realResult.totalCount}
                pageParam="realPage"
                params={{
                  ...sharedParams,
                  demoPage:
                    demoResult.page > 1 ? String(demoResult.page) : undefined,
                }}
              />
            </div>
          </section>

          <section
            aria-labelledby="profit-demo-heading"
            className={cn(
              "border-outline-variant bg-surface-container-low/40 space-y-6 rounded-2xl border p-4 sm:p-6"
            )}
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="profit-demo-heading"
                  className="text-on-surface font-heading text-xl font-semibold"
                >
                  {t("profitSectionDemo")}
                </h2>
                <span className="border-tertiary/40 bg-tertiary/15 text-tertiary dark:text-tertiary-fixed-dim rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                  {t("tradesBalanceDemo")}
                </span>
              </div>
              <p className="text-on-surface-variant text-sm">
                {t("profitSectionDemoDescription")}
              </p>
            </div>

            <AdminProfitSummaryCards summary={overview.demo} />

            <div className="space-y-4">
              <h3 className="text-on-surface font-heading text-base font-semibold">
                {t("profitTableHeading")}
              </h3>
              <AdminProfitTable markets={demoResult.items} />
              <AdminPagination
                pathname="/admin/profit"
                page={demoResult.page}
                totalPages={demoResult.totalPages}
                pageSize={demoResult.pageSize}
                totalCount={demoResult.totalCount}
                pageParam="demoPage"
                params={{
                  ...sharedParams,
                  realPage:
                    realResult.page > 1 ? String(realResult.page) : undefined,
                }}
              />
            </div>
          </section>
        </div>
      </AdminPageShell>
    </>
  )
}

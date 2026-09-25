import { getTranslations } from "next-intl/server"

import { GenerateMarketClient } from "@/components/polymarket/admin/generate-market/generate-market-client"
import { AdminPageShell } from "@/components/polymarket/admin/admin-page-shell"
import { Header } from "@/components/polymarket/landing/header"
import { listManageableMarkets } from "@/lib/polymarket/admin/generate-market-queries"

export default async function AdminGenerateMarketPage() {
  const [t, markets] = await Promise.all([
    getTranslations("Admin"),
    listManageableMarkets(),
  ])

  return (
    <>
      <Header activeNav="generateMarketAdmin" />
      <AdminPageShell>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("generateTitle")}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
          {t("generateDescription")}
        </p>
        <div className="mt-6">
          <GenerateMarketClient markets={markets} />
        </div>
      </AdminPageShell>
    </>
  )
}

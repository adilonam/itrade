import { getTranslations } from "next-intl/server"

import { AdminPageShell } from "@/components/polymarket/admin/admin-page-shell"
import { AdminPayoutsGuide } from "@/components/polymarket/admin/admin-payouts-guide"
import { Header } from "@/components/polymarket/landing/header"

export default async function AdminPayoutsPage() {
  const t = await getTranslations("Admin")

  return (
    <>
      <Header activeNav="payoutsAdmin" />
      <AdminPageShell>
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {t("payoutsTitle")}
          </h1>
          <p className="text-on-surface-variant max-w-2xl text-sm">
            {t("payoutsDescription")}
          </p>
        </div>
        <AdminPayoutsGuide />
      </AdminPageShell>
    </>
  )
}

import { getTranslations } from "next-intl/server"

import { AdminPageShell } from "@/components/polymarket/admin/admin-page-shell"
import { AdminPagination } from "@/components/polymarket/admin/admin-pagination"
import { AdminUserTable } from "@/components/polymarket/admin/admin-user-table"
import { AdminUsersSearch } from "@/components/polymarket/admin/admin-users-search"
import { Header } from "@/components/polymarket/landing/header"
import { parseAdminPagination } from "@/lib/polymarket/admin/pagination"
import { listAdminUsers } from "@/lib/polymarket/admin/user-queries"

type PageProps = {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const query =
    typeof params.q === "string" && params.q.trim().length > 0
      ? params.q.trim()
      : ""
  const pagination = parseAdminPagination(params)

  const [t, result] = await Promise.all([
    getTranslations("Admin"),
    listAdminUsers({ q: query || undefined, ...pagination }),
  ])

  return (
    <>
      <Header activeNav="usersAdmin" />
      <AdminPageShell>
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {t("usersTitle")}
          </h1>
          <p className="text-on-surface-variant max-w-2xl text-sm">
            {t("usersDescription")}
          </p>
        </div>
        <div className="mt-6 space-y-4">
          <AdminUsersSearch query={query} />
          <AdminUserTable users={result.items} searchQuery={query} />
          <AdminPagination
            pathname="/admin/users"
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

import { useTranslations } from "next-intl"

import { buttonVariants } from "@/components/polymarket/ui/button"
import {
  ADMIN_PAGE_SIZE_DEFAULT,
  buildAdminListHref,
} from "@/lib/polymarket/admin/pagination"
import { Link } from "@/lib/polymarket/routing"
import { cn } from "@/lib/utils"

type AdminPaginationProps = {
  pathname: "/admin/market" | "/admin/trades" | "/admin/users" | "/admin/profit"
  page: number
  totalPages: number
  pageSize?: number
  totalCount: number
  /** Query key for the page number (default `page`). */
  pageParam?: string
  /** Extra query params to preserve (e.g. marketId, q). */
  params?: Record<string, string | undefined>
}

export function AdminPagination({
  pathname,
  page,
  totalPages,
  pageSize = ADMIN_PAGE_SIZE_DEFAULT,
  totalCount,
  pageParam,
  params,
}: AdminPaginationProps) {
  const t = useTranslations("Admin")

  if (totalCount === 0) {
    return null
  }

  const prevDisabled = page <= 1
  const nextDisabled = page >= totalPages

  const prevHref = buildAdminListHref(pathname, {
    page: page - 1,
    pageSize,
    pageParam,
    params,
  })
  const nextHref = buildAdminListHref(pathname, {
    page: page + 1,
    pageSize,
    pageParam,
    params,
  })

  return (
    <nav
      className="border-outline-variant flex flex-col items-center justify-between gap-3 border-t px-1 pt-4 sm:flex-row"
      aria-label={t("paginationNav")}
    >
      <p className="text-on-surface-variant text-sm">
        {t("paginationPage", { page, totalPages })}
      </p>
      <div className="flex items-center gap-2">
        {prevDisabled ? (
          <span
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "pointer-events-none opacity-50"
            )}
            aria-disabled="true"
          >
            {t("paginationPrevious")}
          </span>
        ) : (
          <Link
            href={prevHref}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t("paginationPrevious")}
          </Link>
        )}
        {nextDisabled ? (
          <span
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "pointer-events-none opacity-50"
            )}
            aria-disabled="true"
          >
            {t("paginationNext")}
          </span>
        ) : (
          <Link
            href={nextHref}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t("paginationNext")}
          </Link>
        )}
      </div>
    </nav>
  )
}

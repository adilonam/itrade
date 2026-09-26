export const ADMIN_PAGE_SIZE_DEFAULT = 20
export const ADMIN_PAGE_SIZE_MIN = 10
export const ADMIN_PAGE_SIZE_MAX = 50

export type AdminPaginationInput = {
  page: number
  pageSize: number
}

export type AdminPaginatedResult<T> = {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

/** Parse 1-based `page` and optional `pageSize` from search params. */
export function parseAdminPagination(searchParams: {
  page?: string | string[]
  pageSize?: string | string[]
}): AdminPaginationInput {
  const page = parsePositiveInt(firstParam(searchParams.page), 1)
  const rawSize = parsePositiveInt(
    firstParam(searchParams.pageSize),
    ADMIN_PAGE_SIZE_DEFAULT
  )
  const pageSize = Math.min(
    ADMIN_PAGE_SIZE_MAX,
    Math.max(ADMIN_PAGE_SIZE_MIN, rawSize)
  )

  return { page, pageSize }
}

export function resolveAdminPagination(
  totalCount: number,
  input: AdminPaginationInput
): {
  page: number
  pageSize: number
  totalPages: number
  skip: number
  take: number
} {
  const pageSize = input.pageSize
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const page = Math.min(Math.max(1, input.page), totalPages)

  return {
    page,
    pageSize,
    totalPages,
    skip: (page - 1) * pageSize,
    take: pageSize,
  }
}

/** Build admin list URL, omitting default page/pageSize. */
export function buildAdminListHref(
  pathname: string,
  options: {
    page: number
    pageSize: number
    /** Query key for the page number (default `page`). */
    pageParam?: string
    params?: Record<string, string | undefined>
  }
): string {
  const search = new URLSearchParams()
  const pageParam = options.pageParam ?? "page"

  for (const [key, value] of Object.entries(options.params ?? {})) {
    if (value != null && value !== "" && key !== pageParam) {
      search.set(key, value)
    }
  }

  if (options.page > 1) {
    search.set(pageParam, String(options.page))
  }
  if (options.pageSize !== ADMIN_PAGE_SIZE_DEFAULT) {
    search.set("pageSize", String(options.pageSize))
  }

  const qs = search.toString()
  return qs ? `${pathname}?${qs}` : pathname
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value == null || value === "") {
    return fallback
  }
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback
  }
  return parsed
}

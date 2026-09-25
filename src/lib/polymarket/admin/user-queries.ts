import { unstable_noStore as noStore } from "next/cache"

import {
  resolveAdminPagination,
  type AdminPaginatedResult,
  type AdminPaginationInput,
} from "@/lib/polymarket/admin/pagination"
import type { Prisma } from "@/lib/polymarket/db"
import { prisma } from "@/lib/polymarket/db"

const adminUserSelect = {
  id: true,
  name: true,
  username: true,
  email: true,
  role: true,
  predictionBalance: true,
  createdAt: true,
} satisfies Prisma.UserSelect

type AdminUserRow = Prisma.UserGetPayload<{ select: typeof adminUserSelect }>

/** Serialized admin users table row (no password / sensitive fields). */
export type AdminUserListItem = Omit<AdminUserRow, "createdAt"> & {
  createdAt: string
}

export type ListAdminUsersOptions = AdminPaginationInput & {
  /** Case-insensitive contains filter on email, name, or username. */
  q?: string
}

function buildAdminUserWhere(q?: string): Prisma.UserWhereInput | undefined {
  const query = q?.trim()
  if (!query) {
    return undefined
  }

  return {
    OR: [
      { email: { contains: query, mode: "insensitive" } },
      { name: { contains: query, mode: "insensitive" } },
      { username: { contains: query, mode: "insensitive" } },
    ],
  }
}

export async function listAdminUsers(
  options: ListAdminUsersOptions
): Promise<AdminPaginatedResult<AdminUserListItem>> {
  noStore()
  const where = buildAdminUserWhere(options.q)

  const totalCount = await prisma.user.count({ where })
  const { page, pageSize, totalPages, skip, take } = resolveAdminPagination(
    totalCount,
    { page: options.page, pageSize: options.pageSize }
  )

  if (totalCount === 0) {
    return { items: [], totalCount, page, pageSize, totalPages }
  }

  const users = await prisma.user.findMany({
    where,
    select: adminUserSelect,
    orderBy: [{ createdAt: "desc" }],
    skip,
    take,
  })

  const items = users.map((user) => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
  }))

  return { items, totalCount, page, pageSize, totalPages }
}

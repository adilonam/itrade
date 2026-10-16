"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { auth } from "@/lib/polymarket/auth-session"
import {
  BalanceLedgerType,
  UserRole,
  prisma,
} from "@/lib/polymarket/db"
import { isPolymarketAdmin } from "@/lib/polymarket/roles"

const roleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum([UserRole.user, UserRole.admin]),
})

const profileSchema = z.object({
  userId: z.string().min(1),
  name: z
    .string()
    .trim()
    .max(80)
    .transform((value) => (value.length === 0 ? null : value)),
  username: z
    .string()
    .trim()
    .max(32)
    .transform((value) => (value.length === 0 ? null : value))
    .refine(
      (value) => value === null || /^[a-zA-Z0-9_]{3,32}$/.test(value),
      "username"
    ),
})

const balanceSchema = z.discriminatedUnion("mode", [
  z.object({
    userId: z.string().min(1),
    mode: z.literal("set"),
    value: z.number().finite().min(0).max(1_000_000_000),
    note: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined)),
  }),
  z.object({
    userId: z.string().min(1),
    mode: z.literal("adjust"),
    amount: z
      .number()
      .finite()
      .refine((n) => n !== 0, "nonzero")
      .refine((n) => Math.abs(n) <= 1_000_000_000, "max"),
    note: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined)),
  }),
])

export type UpdateAdminUserRoleResult =
  | { ok: true }
  | {
      ok: false
      error:
        | "unauthenticated"
        | "forbidden"
        | "invalid"
        | "not_found"
        | "last_admin"
    }

export type UpdateAdminUserProfileResult =
  | { ok: true }
  | {
      ok: false
      error:
        | "unauthenticated"
        | "forbidden"
        | "invalid"
        | "not_found"
        | "username_taken"
    }

export type AdjustAdminUserBalanceResult =
  | { ok: true; balance: number; sessionUserAffected: boolean }
  | {
      ok: false
      error:
        | "unauthenticated"
        | "forbidden"
        | "invalid"
        | "not_found"
        | "negative_balance"
    }

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false as const, error: "unauthenticated" as const }
  }
  if (!isPolymarketAdmin(session.user.role)) {
    return { ok: false as const, error: "forbidden" as const }
  }
  return { ok: true as const, session }
}

async function revalidateUsersAdmin() {
  revalidatePath(`/polymarket/admin/users`)
  revalidatePath(`/polymarket`)
}

export async function updateAdminUserRole(
  input: z.input<typeof roleSchema>
): Promise<UpdateAdminUserRoleResult> {
  const gate = await requireAdmin()
  if (!gate.ok) {
    return gate
  }

  const parsed = roleSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "invalid" }
  }

  const { userId, role } = parsed.data

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      })
      if (!user) {
        throw new Error("not_found")
      }

      if (user.role === UserRole.admin && role === UserRole.user) {
        const adminCount = await tx.user.count({
          where: { role: UserRole.admin },
        })
        if (adminCount <= 1) {
          throw new Error("last_admin")
        }
      }

      await tx.user.update({
        where: { id: userId },
        data: { role },
      })
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "not_found") {
        return { ok: false, error: "not_found" }
      }
      if (error.message === "last_admin") {
        return { ok: false, error: "last_admin" }
      }
    }
    throw error
  }

  await revalidateUsersAdmin()
  return { ok: true }
}

export async function updateAdminUserProfile(
  input: z.input<typeof profileSchema>
): Promise<UpdateAdminUserProfileResult> {
  const gate = await requireAdmin()
  if (!gate.ok) {
    return gate
  }

  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "invalid" }
  }

  const { userId, name, username } = parsed.data

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { name, username },
    })
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return { ok: false, error: "not_found" }
    }
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "username_taken" }
    }
    throw error
  }

  await revalidateUsersAdmin()
  return { ok: true }
}

export async function adjustAdminUserBalance(
  input: z.input<typeof balanceSchema>
): Promise<AdjustAdminUserBalanceResult> {
  const gate = await requireAdmin()
  if (!gate.ok) {
    return gate
  }

  const parsed = balanceSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "invalid" }
  }

  const data = parsed.data

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: data.userId },
        select: { id: true, predictionBalance: true },
      })
      if (!user) {
        throw new Error("not_found")
      }

      const delta =
        data.mode === "set" ? data.value - user.predictionBalance : data.amount
      const nextBalance = user.predictionBalance + delta

      if (nextBalance < 0) {
        throw new Error("negative_balance")
      }

      if (Math.abs(delta) < 1e-12) {
        return { balance: user.predictionBalance }
      }

      await tx.user.update({
        where: { id: user.id },
        data: { predictionBalance: nextBalance },
      })

      const note =
        data.note ??
        (data.mode === "set"
          ? `Admin set balance to $${data.value.toFixed(2)}`
          : `Admin adjustment ${delta >= 0 ? "+" : ""}$${delta.toFixed(2)}`)

      await tx.predictionBalanceLedger.create({
        data: {
          userId: user.id,
          amount: delta,
          balanceAfter: nextBalance,
          type: BalanceLedgerType.adjustment,
          note,
        },
      })

      return { balance: nextBalance }
    })

    await revalidateUsersAdmin()
    return {
      ok: true,
      balance: result.balance,
      sessionUserAffected: data.userId === gate.session.user.id,
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "not_found") {
        return { ok: false, error: "not_found" }
      }
      if (error.message === "negative_balance") {
        return { ok: false, error: "negative_balance" }
      }
    }
    throw error
  }
}

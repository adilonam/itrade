"use server"

import { auth } from "@/lib/polymarket/auth-session"
import { prisma } from "@/lib/polymarket/db"
import { TRADE_BALANCE_TYPES } from "@/lib/balance-selection"
import {
  emptyBalances,
  type UserBalanceAmounts,
} from "@/lib/polymarket/balance/amounts"

export type { UserBalanceAmounts }

export async function getMyUserBalanceAmounts(): Promise<UserBalanceAmounts | null> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return null
  }

  const rows = await prisma.userBalance.findMany({
    where: {
      userId,
      type: { in: [...TRADE_BALANCE_TYPES] },
    },
    select: { type: true, amount: true },
  })

  const amounts = emptyBalances()
  for (const row of rows) {
    if (row.type === "REAL" || row.type === "DEMO") {
      amounts[row.type] = row.amount
    }
  }
  return amounts
}

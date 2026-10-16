import { BalanceSwitcher } from "@/components/polymarket/auth/balance-switcher"
import { TRADE_BALANCE_TYPES } from "@/lib/balance-selection"
import { emptyBalances } from "@/lib/polymarket/balance/amounts"
import { auth } from "@/lib/polymarket/auth-session"
import { prisma } from "@/lib/polymarket/db"

export async function BalanceCard() {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  const rows = await prisma.userBalance.findMany({
    where: {
      userId: session.user.id,
      type: { in: [...TRADE_BALANCE_TYPES] },
    },
    select: { type: true, amount: true },
  })

  const initialAmounts = emptyBalances()
  for (const row of rows) {
    if (row.type === "REAL" || row.type === "DEMO") {
      initialAmounts[row.type] = row.amount
    }
  }

  return <BalanceSwitcher initialAmounts={initialAmounts} />
}

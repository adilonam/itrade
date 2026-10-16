import { getTranslations } from "next-intl/server"

import { auth } from "@/lib/polymarket/auth-session"
import { formatBalance } from "@/components/polymarket/markets/data"
import { prisma } from "@/lib/polymarket/db"

export async function BalanceCard() {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  const t = await getTranslations("Header")
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { predictionBalance: true },
  })
  const balance =
    user?.predictionBalance ??
    (session.user as { predictionBalance?: number }).predictionBalance ??
    0

  return (
    <div
      className="bg-surface-container-low dark:bg-surface-container-high/60 border-outline-variant dark:border-on-secondary-container hidden items-center gap-2 rounded-lg border px-3 py-1.5 sm:flex"
      title={t("balance")}
    >
      <span className="text-on-surface-variant dark:text-secondary-fixed-dim font-label text-[10px] tracking-wide uppercase">
        {t("balance")}
      </span>
      <span className="font-data text-data-mono text-sm font-semibold text-primary dark:text-primary-fixed-dim">
        {formatBalance(balance)}
      </span>
    </div>
  )
}

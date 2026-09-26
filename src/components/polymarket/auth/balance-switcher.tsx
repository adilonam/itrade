"use client"

import { Check, ChevronDown } from "lucide-react"
import { useTranslations } from "next-intl"
import { useCallback, useEffect, useState } from "react"

import { formatBalance } from "@/components/polymarket/markets/data"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/polymarket/ui/dropdown-menu"
import { useTradeBalanceSelection } from "@/hooks/use-trade-balance-selection"
import {
  TRADE_BALANCE_CHANGE_EVENT,
  TRADE_BALANCE_TYPES,
  type TradeBalanceType,
} from "@/lib/balance-selection"
import type { UserBalanceAmounts } from "@/lib/polymarket/balance/amounts"
import { getMyUserBalanceAmounts } from "@/lib/polymarket/balance/actions"
import { useRouter } from "@/lib/polymarket/routing"
import { cn } from "@/lib/utils"

type BalanceSwitcherProps = {
  initialAmounts: UserBalanceAmounts
}

export function BalanceSwitcher({ initialAmounts }: BalanceSwitcherProps) {
  const t = useTranslations("Header")
  const router = useRouter()
  const { selectedBalanceType, setTradeBalanceType } =
    useTradeBalanceSelection()
  const [amounts, setAmounts] = useState<UserBalanceAmounts>(initialAmounts)

  const balanceLabel: Record<TradeBalanceType, string> = {
    REAL: t("balanceReal"),
    DEMO: t("balanceDemo"),
  }

  const loadAmounts = useCallback(async () => {
    const next = await getMyUserBalanceAmounts()
    if (next) {
      setAmounts(next)
    }
  }, [])

  useEffect(() => {
    setAmounts(initialAmounts)
  }, [initialAmounts])

  useEffect(() => {
    const onBalanceTypeChange = () => {
      void loadAmounts()
      router.refresh()
    }

    window.addEventListener(TRADE_BALANCE_CHANGE_EVENT, onBalanceTypeChange)
    return () => {
      window.removeEventListener(
        TRADE_BALANCE_CHANGE_EVENT,
        onBalanceTypeChange
      )
    }
  }, [loadAmounts, router])

  const selectedAmount = amounts[selectedBalanceType] ?? 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "bg-surface-container-low dark:bg-surface-container-high/60 border-outline-variant dark:border-on-secondary-container hidden items-center gap-2 rounded-lg border px-3 py-1.5 sm:flex",
          "hover:bg-surface-container dark:hover:bg-on-secondary-fixed-variant transition-colors outline-none",
          "focus-visible:ring-3 focus-visible:ring-ring/30"
        )}
        title={t("balanceTitle", { type: selectedBalanceType })}
        aria-label={t("balanceTypeSelector")}
      >
        <span className="text-on-surface-variant dark:text-secondary-fixed-dim font-label text-[10px] tracking-wide uppercase">
          {t("balance")}
        </span>
        <span className="font-data text-data-mono text-sm font-semibold text-primary dark:text-primary-fixed-dim">
          {formatBalance(selectedAmount)}
        </span>
        <ChevronDown className="text-on-surface-variant dark:text-secondary-fixed-dim size-3.5 shrink-0 opacity-70" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="min-w-52 border border-outline-variant bg-surface-white p-1.5 text-on-surface shadow-xl ring-0 dark:border-on-secondary-container dark:bg-on-secondary-fixed dark:text-inverse-on-surface"
      >
        {TRADE_BALANCE_TYPES.map((balanceType) => {
          const isSelected = selectedBalanceType === balanceType
          const amount = amounts[balanceType] ?? 0

          return (
            <DropdownMenuItem
              key={balanceType}
              className={cn(
                "text-on-surface hover:bg-surface-container-low focus:bg-surface-container-low dark:text-inverse-on-surface dark:hover:bg-on-secondary-fixed-variant dark:focus:bg-on-secondary-fixed-variant flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2",
                isSelected &&
                  "bg-surface-container-low dark:bg-on-secondary-fixed-variant"
              )}
              onClick={() => {
                void setTradeBalanceType(balanceType)
              }}
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {balanceLabel[balanceType]}
                </span>
                <span className="font-data text-data-mono text-xs text-on-surface-variant dark:text-secondary-fixed-dim">
                  {formatBalance(amount)}
                </span>
              </div>
              {isSelected ? (
                <Check className="size-4 shrink-0 text-primary dark:text-primary-fixed-dim" />
              ) : null}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

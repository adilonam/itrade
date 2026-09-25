"use client"

import { ChevronDown } from "lucide-react"
import { useSession } from "next-auth/react"
import { useState, useTransition } from "react"
import { useRouter } from "@/lib/polymarket/routing"

import { Button, buttonVariants } from "@/components/polymarket/ui/button"
import { Input } from "@/components/polymarket/ui/input"
import { MarketThumb } from "@/components/polymarket/markets/market-thumb"
import { formatCents } from "@/components/polymarket/markets/data"
import { placeTrade } from "@/lib/polymarket/markets/actions"
import { MarketStatus, OutcomeType, TradeSide } from "@/lib/polymarket/db-types"
import { cn } from "@/lib/utils"
import { Link } from "@/lib/polymarket/routing"
import type { MarketDetail } from "@/lib/polymarket/markets/queries"

const QUICK_AMOUNTS = [1, 5, 10, 100] as const

export function TradePanel({
  market,
  signedIn,
  initialSide = TradeSide.BUY,
  initialOutcome = OutcomeType.YES,
}: {
  market: MarketDetail
  signedIn: boolean
  initialSide?: TradeSide
  initialOutcome?: OutcomeType
}) {
  const router = useRouter()
  const { update } = useSession()
  const [side, setSide] = useState<TradeSide>(initialSide)
  const [outcome, setOutcome] = useState<OutcomeType>(initialOutcome)
  const [amount, setAmount] = useState(0)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const yesCents = formatCents(market.yesPrice)
  const noCents = formatCents(market.noPrice)
  const isOpen = market.status === MarketStatus.open

  function trade() {
    if (!isOpen || amount <= 0) {
      return
    }
    startTransition(async () => {
      const result = await placeTrade({
        marketId: market.id,
        outcomeType: outcome,
        side,
        amount,
      })
      if (!result.ok) {
        const errors: Record<typeof result.error, string> = {
          unauthenticated: "Sign in to trade.",
          invalid: "Enter a valid amount.",
          closed: "This market is closed.",
          not_found: "Market not found.",
          insufficient_shares: "Not enough shares to sell.",
          insufficient_funds: "Insufficient balance.",
        }
        setMessage(errors[result.error])
        return
      }
      setMessage(side === TradeSide.BUY ? "Bought." : "Sold.")
      setAmount(0)
      await update()
      router.refresh()
    })
  }

  const winnerLabel =
    market.winningOutcome === OutcomeType.YES
      ? "Yes"
      : market.winningOutcome === OutcomeType.NO
        ? "No"
        : null

  if (!isOpen) {
    return (
      <aside className="bg-surface-white border-outline-variant rounded-xl border p-4 shadow-sm">
        <div className="mb-4 flex gap-2">
          <MarketThumb
            src={market.imageUrl}
            label={market.iconLabel ?? "M"}
            size={36}
            className="size-9 rounded-md"
          />
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-semibold">{market.title}</p>
            <p className="text-secondary text-xs font-semibold">
              Resolved / settled
            </p>
          </div>
        </div>

        <div className="bg-surface-container rounded-lg px-4 py-5 text-center">
          <p className="text-on-surface text-sm font-semibold">
            Trading is closed
          </p>
          <p className="text-secondary mt-1 text-sm">
            {winnerLabel
              ? `This market resolved ${winnerLabel}. Winners were paid $1 per net winning share.`
              : "This market is resolved and no longer accepts trades."}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-bold">
            <div
              className={cn(
                "rounded-lg py-3",
                market.winningOutcome === OutcomeType.YES
                  ? "bg-success-green text-white"
                  : "bg-surface-container-high text-on-surface"
              )}
            >
              Yes {yesCents}
            </div>
            <div
              className={cn(
                "rounded-lg py-3",
                market.winningOutcome === OutcomeType.NO
                  ? "bg-danger-red text-white"
                  : "bg-surface-container-high text-on-surface"
              )}
            >
              No {noCents}
            </div>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className="bg-surface-white border-outline-variant rounded-xl border p-4 shadow-sm">
      <div className="mb-4 flex gap-2">
        <MarketThumb
          src={market.imageUrl}
          label={market.iconLabel ?? "M"}
          size={36}
          className="size-9 rounded-md"
        />
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold">{market.title}</p>
          <p
            className={cn(
              "text-xs font-semibold",
              outcome === OutcomeType.YES
                ? "text-success-green"
                : "text-danger-red"
            )}
          >
            {outcome === OutcomeType.YES ? "Yes" : "No"}
          </p>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between gap-2 text-sm">
        <span className="text-secondary inline-flex items-center gap-1 font-medium">
          Market <ChevronDown className="size-3" />
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setSide(TradeSide.BUY)}
            className={cn(
              "h-8 rounded-md px-3 text-sm font-semibold",
              side === TradeSide.BUY
                ? "bg-success-green text-white hover:bg-success-green/90 hover:text-white"
                : "bg-success-green/15 text-success-green hover:bg-success-green/25 hover:text-success-green"
            )}
          >
            Buy
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setSide(TradeSide.SELL)}
            className={cn(
              "h-8 rounded-md px-3 text-sm font-semibold",
              side === TradeSide.SELL
                ? "bg-danger-red text-white hover:bg-danger-red/90 hover:text-white"
                : "bg-danger-red/15 text-danger-red hover:bg-danger-red/25 hover:text-danger-red"
            )}
          >
            Sell
          </Button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setOutcome(OutcomeType.YES)}
          className={cn(
            "rounded-lg py-3 text-sm font-bold",
            outcome === OutcomeType.YES
              ? "bg-success-green text-white"
              : "bg-surface-container text-on-surface hover:bg-surface-container-high"
          )}
        >
          Yes {yesCents}
        </button>
        <button
          type="button"
          onClick={() => setOutcome(OutcomeType.NO)}
          className={cn(
            "rounded-lg py-3 text-sm font-bold",
            outcome === OutcomeType.NO
              ? "bg-danger-red text-white"
              : "bg-surface-container text-on-surface hover:bg-surface-container-high"
          )}
        >
          No {noCents}
        </button>
      </div>

      <label className="text-secondary mb-1 block text-xs font-semibold">
        Amount
      </label>
      <div className="relative mb-3">
        <span className="text-secondary pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-lg">
          $
        </span>
        <Input
          type="number"
          min={0}
          step="1"
          value={amount || ""}
          onChange={(event) => setAmount(Number(event.target.value) || 0)}
          placeholder="0"
          className="h-14 rounded-xl pl-7 text-2xl font-semibold"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setAmount((current) => current + value)}
            className="bg-surface-container hover:bg-surface-container-high rounded-full px-3 py-1 text-xs font-semibold"
          >
            +${value}
          </button>
        ))}
      </div>

      {signedIn ? (
        <Button
          className="bg-primary-container hover:bg-primary h-12 w-full rounded-xl text-base font-semibold text-white"
          disabled={pending || amount <= 0}
          onClick={trade}
        >
          {pending ? "Trading…" : "Trade"}
        </Button>
      ) : (
        <Link
          href="/sign-in"
          className={buttonVariants({
            className:
              "bg-primary-container hover:bg-primary h-12 w-full rounded-xl text-base font-semibold text-white",
          })}
        >
          Sign in to trade
        </Link>
      )}

      {message ? (
        <p className="text-secondary mt-2 text-center text-sm">{message}</p>
      ) : null}
    </aside>
  )
}

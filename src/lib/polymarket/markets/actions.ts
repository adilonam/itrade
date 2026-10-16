"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { auth } from "@/lib/polymarket/auth-session"
import {
  BalanceLedgerType,
  MarketStatus,
  OutcomeType,
  TradeSide,
  UserRole,
  prisma,
} from "@/lib/polymarket/db"
import { isPolymarketAdmin } from "@/lib/polymarket/roles"

const tradeSchema = z.object({
  marketId: z.string().min(1),
  outcomeType: z.enum(["YES", "NO"]),
  side: z.enum(["BUY", "SELL"]),
  amount: z.number().positive().max(1_000_000),
})

const commentSchema = z.object({
  marketId: z.string().min(1),
  content: z.string().trim().min(1).max(2000),
  parentId: z.string().min(1).optional(),
})

const resolveSchema = z.object({
  marketId: z.string().min(1),
  winningOutcome: z.enum(["YES", "NO"]),
})

export type PlaceTradeResult =
  | { ok: true; balance: number }
  | {
      ok: false
      error:
        | "unauthenticated"
        | "invalid"
        | "closed"
        | "not_found"
        | "insufficient_shares"
        | "insufficient_funds"
    }

export type CommentResult =
  | { ok: true }
  | { ok: false; error: "unauthenticated" | "invalid" | "not_found" }

export type ResolveMarketResult =
  | { ok: true; winnersPaid: number; totalPayout: number }
  | {
      ok: false
      error:
        | "unauthenticated"
        | "forbidden"
        | "invalid"
        | "not_found"
        | "closed"
        | "already_resolved"
    }

function clampPrice(value: number): number {
  return Math.min(0.99, Math.max(0.01, value))
}

async function revalidateMarket(slug: string) {
  revalidatePath(`/polymarket/markets/${slug}`)
  revalidatePath(`/polymarket/markets`)
  revalidatePath(`/polymarket`)
  revalidatePath(`/polymarket/admin/market`)
}

export async function placeTrade(
  input: z.input<typeof tradeSchema>
): Promise<PlaceTradeResult> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return { ok: false, error: "unauthenticated" }
  }

  const parsed = tradeSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "invalid" }
  }

  const { marketId, outcomeType, side, amount } = parsed.data

  try {
    const { slug, balance } = await prisma.$transaction(async (tx) => {
      const market = await tx.predictionMarket.findUnique({
        where: { id: marketId },
        include: { outcomes: true },
      })
      if (!market) {
        throw new Error("not_found")
      }
      if (market.status !== MarketStatus.open) {
        throw new Error("closed")
      }

      const outcome = market.outcomes.find((row) => row.type === outcomeType)
      const other = market.outcomes.find((row) => row.type !== outcomeType)
      if (!outcome || !other) {
        throw new Error("not_found")
      }

      const price = outcome.currentPrice
      if (price <= 0) {
        throw new Error("invalid")
      }

      const shares = amount / price

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { predictionBalance: true },
      })
      if (!user) {
        throw new Error("not_found")
      }

      if (side === TradeSide.BUY) {
        if (user.predictionBalance + 1e-9 < amount) {
          throw new Error("insufficient_funds")
        }
      }

      if (side === TradeSide.SELL) {
        const prior = await tx.predictionTrade.findMany({
          where: { userId, outcomeId: outcome.id },
        })
        const held = prior.reduce(
          (sum, trade) =>
            sum + (trade.side === TradeSide.BUY ? trade.shares : -trade.shares),
          0
        )
        if (held + 1e-9 < shares) {
          throw new Error("insufficient_shares")
        }
      }

      const yes = market.outcomes.find((row) => row.type === OutcomeType.YES)
      if (!yes) {
        throw new Error("not_found")
      }

      const impact = Math.min(
        0.04,
        Math.max(0.001, (amount / Math.max(market.liquidity, 1_000)) * 0.2)
      )
      const buyingYes =
        (side === TradeSide.BUY && outcomeType === OutcomeType.YES) ||
        (side === TradeSide.SELL && outcomeType === OutcomeType.NO)
      const nextYes = clampPrice(yes.currentPrice + (buyingYes ? impact : -impact))
      const nextNo = clampPrice(1 - nextYes)
      const now = new Date()

      const trade = await tx.predictionTrade.create({
        data: {
          userId,
          marketId,
          outcomeId: outcome.id,
          side,
          amount,
          shares,
          priceAtTrade: price,
        },
      })

      const delta = side === TradeSide.BUY ? -amount : amount
      const nextBalance = user.predictionBalance + delta
      await tx.user.update({
        where: { id: userId },
        data: { predictionBalance: nextBalance },
      })

      await tx.predictionBalanceLedger.create({
        data: {
          userId,
          amount: delta,
          balanceAfter: nextBalance,
          type:
            side === TradeSide.BUY
              ? BalanceLedgerType.trade_buy
              : BalanceLedgerType.trade_sell,
          marketId,
          tradeId: trade.id,
          note:
            side === TradeSide.BUY
              ? `Bought ${shares.toFixed(4)} ${outcomeType} shares`
              : `Sold ${shares.toFixed(4)} ${outcomeType} shares`,
        },
      })

      await tx.predictionMarket.update({
        where: { id: marketId },
        data: { totalVolume: { increment: amount } },
      })

      await tx.predictionOutcome.update({
        where: { id: yes.id },
        data: { currentPrice: nextYes },
      })
      const no = market.outcomes.find((row) => row.type === OutcomeType.NO)
      if (no) {
        await tx.predictionOutcome.update({
          where: { id: no.id },
          data: { currentPrice: nextNo },
        })
      }

      await tx.predictionPriceHistory.create({
        data: {
          marketId,
          outcomeId: yes.id,
          probability: nextYes,
          timestamp: now,
        },
      })
      if (no) {
        await tx.predictionPriceHistory.create({
          data: {
            marketId,
            outcomeId: no.id,
            probability: nextNo,
            timestamp: now,
          },
        })
      }

      return { slug: market.slug, balance: nextBalance }
    })

    await revalidateMarket(slug)
    return { ok: true, balance }
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    if (
      message === "not_found" ||
      message === "closed" ||
      message === "insufficient_shares" ||
      message === "insufficient_funds" ||
      message === "invalid"
    ) {
      return { ok: false, error: message }
    }
    throw error
  }
}

/**
 * Admin-only market settlement.
 * Pays winners `netShares * $1` for the winning outcome (BUY − SELL > 0).
 * Losing positions are not cash-settled (worthless at $0); only win credits
 * are written to the balance ledger.
 *
 * Allowed when the market is `open`, or already `resolved` with
 * `winningOutcome == null` (e.g. seed data that never paid winners).
 * Fully settled markets (`winningOutcome` set) cannot be resolved again.
 */
export async function resolveMarket(
  input: z.input<typeof resolveSchema>
): Promise<ResolveMarketResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: "unauthenticated" }
  }
  if (!isPolymarketAdmin(session.user.role)) {
    return { ok: false, error: "forbidden" }
  }

  const parsed = resolveSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "invalid" }
  }

  const { marketId, winningOutcome } = parsed.data
  const winningType =
    winningOutcome === "YES" ? OutcomeType.YES : OutcomeType.NO

  try {
    const result = await prisma.$transaction(async (tx) => {
      const market = await tx.predictionMarket.findUnique({
        where: { id: marketId },
        include: {
          outcomes: true,
          trades: {
            include: { outcome: { select: { type: true } } },
          },
        },
      })
      if (!market) {
        throw new Error("not_found")
      }

      const canSettleOpen = market.status === MarketStatus.open
      const canSettleUnpaid =
        market.status === MarketStatus.resolved &&
        market.winningOutcome == null
      if (!canSettleOpen && !canSettleUnpaid) {
        if (
          market.status === MarketStatus.resolved &&
          market.winningOutcome != null
        ) {
          throw new Error("already_resolved")
        }
        throw new Error("closed")
      }

      const yes = market.outcomes.find((row) => row.type === OutcomeType.YES)
      const no = market.outcomes.find((row) => row.type === OutcomeType.NO)
      if (!yes || !no) {
        throw new Error("not_found")
      }

      const netByUser = new Map<string, number>()
      for (const trade of market.trades) {
        if (trade.outcome.type !== winningType) {
          continue
        }
        const signed =
          trade.side === TradeSide.BUY ? trade.shares : -trade.shares
        netByUser.set(
          trade.userId,
          (netByUser.get(trade.userId) ?? 0) + signed
        )
      }

      let winnersPaid = 0
      let totalPayout = 0

      for (const [userId, netShares] of Array.from(netByUser.entries())) {
        if (netShares <= 1e-9) {
          continue
        }
        const payout = netShares * 1
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { predictionBalance: true },
        })
        if (!user) {
          continue
        }
        const nextBalance = user.predictionBalance + payout
        await tx.user.update({
          where: { id: userId },
          data: { predictionBalance: nextBalance },
        })
        await tx.predictionBalanceLedger.create({
          data: {
            userId,
            amount: payout,
            balanceAfter: nextBalance,
            type: BalanceLedgerType.market_win,
            marketId,
            note: `Resolved ${winningOutcome}: ${netShares.toFixed(4)} shares @ $1`,
          },
        })
        winnersPaid += 1
        totalPayout += payout
      }

      const now = new Date()
      const winPrice = 1
      const losePrice = 0

      await tx.predictionMarket.update({
        where: { id: marketId },
        data: {
          status: MarketStatus.resolved,
          winningOutcome: winningType,
        },
      })

      await tx.predictionOutcome.update({
        where: { id: yes.id },
        data: {
          currentPrice:
            winningType === OutcomeType.YES ? winPrice : losePrice,
        },
      })
      await tx.predictionOutcome.update({
        where: { id: no.id },
        data: {
          currentPrice:
            winningType === OutcomeType.NO ? winPrice : losePrice,
        },
      })

      await tx.predictionPriceHistory.createMany({
        data: [
          {
            marketId,
            outcomeId: yes.id,
            probability:
              winningType === OutcomeType.YES ? winPrice : losePrice,
            timestamp: now,
          },
          {
            marketId,
            outcomeId: no.id,
            probability:
              winningType === OutcomeType.NO ? winPrice : losePrice,
            timestamp: now,
          },
        ],
      })

      return { slug: market.slug, winnersPaid, totalPayout }
    })

    await revalidateMarket(result.slug)
    return {
      ok: true,
      winnersPaid: result.winnersPaid,
      totalPayout: result.totalPayout,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    if (
      message === "not_found" ||
      message === "closed" ||
      message === "already_resolved"
    ) {
      return { ok: false, error: message }
    }
    throw error
  }
}

export async function postComment(
  input: z.input<typeof commentSchema>
): Promise<CommentResult> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return { ok: false, error: "unauthenticated" }
  }

  const parsed = commentSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "invalid" }
  }

  const market = await prisma.predictionMarket.findUnique({
    where: { id: parsed.data.marketId },
    select: { id: true, slug: true },
  })
  if (!market) {
    return { ok: false, error: "not_found" }
  }

  await prisma.predictionComment.create({
    data: {
      userId,
      marketId: market.id,
      content: parsed.data.content,
      parentId: parsed.data.parentId,
    },
  })

  await revalidateMarket(market.slug)
  return { ok: true }
}

export async function likeComment(commentId: string): Promise<CommentResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: "unauthenticated" }
  }

  const comment = await prisma.predictionComment.update({
    where: { id: commentId },
    data: { likes: { increment: 1 } },
    select: { market: { select: { slug: true } } },
  })

  await revalidateMarket(comment.market.slug)
  return { ok: true }
}

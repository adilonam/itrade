"use client"

import { Heart, Smile } from "lucide-react"
import { useState, useTransition } from "react"

import { likeComment, postComment } from "@/lib/polymarket/markets/actions"
import type {
  ActivityView,
  CommentView,
  HolderView,
  PositionView,
} from "@/lib/polymarket/markets/queries"
import type { TradeBalanceType } from "@/lib/balance-selection"
import { Button } from "@/components/polymarket/ui/button"
import { Input } from "@/components/polymarket/ui/input"
import { MarketThumb } from "@/components/polymarket/markets/market-thumb"
import { formatCents, formatUsdVolume } from "@/components/polymarket/markets/data"
import { cn } from "@/lib/utils"
import { Link } from "@/lib/polymarket/routing"

type BalanceFilter = "ALL" | TradeBalanceType

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const minutes = Math.max(1, Math.floor(ms / 60_000))
  if (minutes < 60) {
    return `${minutes}m ago`
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}h ago`
  }
  return `${Math.floor(hours / 24)}d ago`
}

function displayName(user: {
  username: string | null
  name: string | null
}): string {
  return user.username ?? user.name ?? "Trader"
}

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

function balanceLabel(balanceType: TradeBalanceType): string {
  return balanceType === "REAL" ? "Real" : "Demo"
}

function BalanceBadge({ balanceType }: { balanceType: TradeBalanceType }) {
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        balanceType === "REAL"
          ? "bg-primary/15 text-primary dark:text-primary-fixed-dim"
          : "bg-tertiary/15 text-tertiary dark:text-tertiary-fixed-dim"
      )}
    >
      {balanceLabel(balanceType)}
    </span>
  )
}

type Tab = "comments" | "holders" | "positions" | "activity"

export function Discussion({
  marketId,
  comments,
  holders,
  activity,
  positions,
  signedIn,
}: {
  marketId: string
  comments: CommentView[]
  holders: HolderView[]
  activity: ActivityView[]
  positions: PositionView[]
  signedIn: boolean
}) {
  const [tab, setTab] = useState<Tab>("comments")
  const [balanceFilter, setBalanceFilter] = useState<BalanceFilter>("ALL")
  const [content, setContent] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const commentCount =
    comments.length + comments.reduce((sum, c) => sum + c.replies.length, 0)

  const showBalanceFilter =
    tab === "holders" || tab === "positions" || tab === "activity"

  const filteredHolders =
    balanceFilter === "ALL"
      ? holders
      : holders.filter((row) => row.balanceType === balanceFilter)
  const filteredPositions =
    balanceFilter === "ALL"
      ? positions
      : positions.filter((row) => row.balanceType === balanceFilter)
  const filteredActivity =
    balanceFilter === "ALL"
      ? activity
      : activity.filter((row) => row.balanceType === balanceFilter)

  function submit() {
    const text = content.trim()
    if (!text) {
      return
    }
    startTransition(async () => {
      const result = await postComment({
        marketId,
        content: text,
        parentId: replyTo ?? undefined,
      })
      if (!result.ok) {
        setError(
          result.error === "unauthenticated"
            ? "Sign in to comment."
            : "Unable to post comment."
        )
        return
      }
      setContent("")
      setReplyTo(null)
      setError(null)
    })
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-outline-variant">
        <div className="flex flex-wrap gap-4">
          {(
            [
              ["comments", `Comments (${commentCount})`],
              ["holders", "Top Holders"],
              ["positions", "Positions"],
              ["activity", "Activity"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "font-label pb-2 text-sm font-semibold",
                tab === key
                  ? "text-on-surface border-on-surface border-b-2"
                  : "text-secondary"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {showBalanceFilter ? (
          <div
            className="mb-2 flex flex-wrap gap-1"
            role="group"
            aria-label="Filter by balance type"
          >
            {(
              [
                ["ALL", "All"],
                ["REAL", "Real"],
                ["DEMO", "Demo"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setBalanceFilter(value)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
                  balanceFilter === value
                    ? "bg-on-surface text-surface"
                    : "bg-surface-container text-secondary hover:text-on-surface"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {tab === "comments" ? (
        <div>
          {signedIn ? (
            <div className="mb-5 flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder={
                    replyTo ? "Write a reply..." : "Add a comment..."
                  }
                  className="h-11 rounded-xl pr-10"
                />
                <Smile className="text-secondary pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
              </div>
              <Button
                className="h-11 rounded-xl px-5"
                onClick={submit}
                disabled={pending || !content.trim()}
              >
                Post
              </Button>
            </div>
          ) : (
            <p className="text-secondary mb-5 text-sm">
              <Link href="/sign-in" className="text-primary underline">
                Sign in
              </Link>{" "}
              to comment.
            </p>
          )}
          {error ? (
            <p className="text-danger-red mb-3 text-sm">{error}</p>
          ) : null}

          <ul className="space-y-5">
            {comments.length === 0 ? (
              <li className="bg-surface-container/60 rounded-xl px-4 py-8 text-center">
                <p className="text-on-surface text-sm font-semibold">
                  No comments yet
                </p>
                <p className="text-secondary mt-1 text-sm">
                  Be the first to share a view on this market.
                </p>
              </li>
            ) : (
              comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onReply={(id) => {
                    setReplyTo(id)
                  }}
                  onLike={(id) => {
                    startTransition(async () => {
                      await likeComment(id)
                    })
                  }}
                />
              ))
            )}
          </ul>
        </div>
      ) : null}

      {tab === "holders" ? (
        <ul className="space-y-3">
          {filteredHolders.length === 0 ? (
            <p className="text-secondary text-sm">No holders yet.</p>
          ) : (
            filteredHolders.map((holder) => (
              <li
                key={`${holder.userId}:${holder.balanceType}:${holder.outcome}`}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <MarketThumb
                    src={holder.avatarUrl}
                    label={initials(displayName(holder))}
                    size={32}
                    className="size-8 rounded-full"
                  />
                  <span className="text-sm font-semibold">
                    {displayName(holder)}
                  </span>
                  <BalanceBadge balanceType={holder.balanceType} />
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                    holder.outcome === "YES"
                      ? "bg-success-green/10 text-success-green"
                      : "bg-danger-red/10 text-danger-red"
                  )}
                >
                  {holder.shares >= 1000
                    ? `${(holder.shares / 1000).toFixed(1)}K`
                    : holder.shares.toFixed(0)}{" "}
                  {holder.outcome}
                </span>
              </li>
            ))
          )}
        </ul>
      ) : null}

      {tab === "positions" ? (
        signedIn ? (
          filteredPositions.length > 0 ? (
            <ul className="space-y-2">
              {filteredPositions.map((pos) => (
                <li
                  key={`${pos.balanceType}:${pos.outcome}`}
                  className="bg-surface-container flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span>{pos.outcome}</span>
                    <BalanceBadge balanceType={pos.balanceType} />
                  </span>
                  <span className="font-data">{pos.shares.toFixed(2)} shares</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-secondary text-sm">
              You have no positions in this market
              {balanceFilter === "ALL" ? "" : ` (${balanceLabel(balanceFilter)})`}
              .
            </p>
          )
        ) : (
          <p className="text-secondary text-sm">
            <Link href="/sign-in" className="text-primary underline">
              Sign in
            </Link>{" "}
            to see your positions.
          </p>
        )
      ) : null}

      {tab === "activity" ? (
        <ul className="space-y-3">
          {filteredActivity.length === 0 ? (
            <p className="text-secondary text-sm">No trades yet.</p>
          ) : (
            filteredActivity.map((row) => (
              <li key={row.id} className="text-sm">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  {row.username ?? row.userName ?? "Trader"}
                  <BalanceBadge balanceType={row.balanceType} />
                </span>{" "}
                {row.side.toLowerCase()} {row.outcome} ·{" "}
                {formatCents(row.priceAtTrade)} · {formatUsdVolume(row.amount)} ·{" "}
                {timeAgo(row.createdAt)}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </section>
  )
}

function CommentItem({
  comment,
  onReply,
  onLike,
  nested = false,
}: {
  comment: CommentView
  onReply: (id: string) => void
  onLike: (id: string) => void
  nested?: boolean
}) {
  const name = displayName(comment.author)
  return (
    <li className={cn(nested && "ml-10 mt-3")}>
      <div className="flex gap-3">
        <MarketThumb
          src={comment.author.avatarUrl}
          label={initials(name)}
          size={36}
          className="size-9 rounded-full"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{name}</span>
            {comment.positionLabel ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold",
                  comment.positionLabel.includes("YES")
                    ? "bg-success-green/10 text-success-green"
                    : "bg-danger-red/10 text-danger-red"
                )}
              >
                {comment.positionLabel}
              </span>
            ) : null}
            <span className="text-secondary text-xs">
              {timeAgo(comment.createdAt)}
            </span>
          </div>
          <p className="mt-1 text-sm">{comment.content}</p>
          <div className="text-secondary mt-1 flex items-center gap-3 text-xs">
            <button
              type="button"
              className="hover:text-on-surface inline-flex items-center gap-1"
              onClick={() => onLike(comment.id)}
            >
              <Heart className="size-3" />
              {comment.likes}
            </button>
            <button
              type="button"
              className="hover:text-on-surface"
              onClick={() => onReply(comment.id)}
            >
              Reply
            </button>
          </div>
        </div>
      </div>
      {comment.replies.length > 0 ? (
        <ul>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onLike={onLike}
              nested
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

"use client"

import { useMemo, useState } from "react"

import { MarketThumb } from "@/components/polymarket/markets/market-thumb"
import { formatProbabilityPercent } from "@/components/polymarket/markets/data"
import { Link } from "@/lib/polymarket/routing"
import type { RelatedMarket } from "@/lib/polymarket/markets/queries"
import { cn } from "@/lib/utils"

export function RelatedMarkets({ markets }: { markets: RelatedMarket[] }) {
  const tags = useMemo(() => {
    const set = new Set<string>()
    for (const market of markets) {
      for (const tag of market.tags) {
        set.add(tag)
      }
    }
    return ["All", ...Array.from(set).slice(0, 4)]
  }, [markets])
  const [tag, setTag] = useState("All")
  const filtered =
    tag === "All"
      ? markets
      : markets.filter((market) => market.tags.includes(tag))

  if (markets.length === 0) {
    return null
  }

  return (
    <section className="bg-surface-white border-outline-variant mt-4 rounded-xl border p-4">
      <h3 className="mb-3 text-sm font-semibold">Related</h3>
      <div className="mb-3 flex flex-wrap gap-2">
        {tags.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTag(item)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              tag === item
                ? "bg-on-surface text-surface-white"
                : "bg-surface-container text-on-surface"
            )}
          >
            {item}
          </button>
        ))}
      </div>
      <ul className="space-y-3">
        {filtered.map((market) => (
          <li key={market.id}>
            <Link
              href={`/markets/${market.slug}`}
              className="flex items-center gap-2"
            >
              <MarketThumb
                src={market.imageUrl}
                label={market.iconLabel ?? "M"}
                size={28}
                className="size-7 rounded-md"
              />
              <span className="min-w-0 flex-1 text-sm leading-snug line-clamp-2">
                {market.title}
              </span>
              <span className="text-sm font-semibold">
                {formatProbabilityPercent(market.probability)}%
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

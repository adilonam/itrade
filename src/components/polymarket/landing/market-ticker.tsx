import { listFeaturedMarketCards } from "@/lib/polymarket/markets/queries"
import {
  formatProbabilityPercent,
} from "@/components/polymarket/markets/data"

import { Link } from "@/lib/polymarket/routing"

export async function MarketTicker() {
  const markets = await listFeaturedMarketCards(8)
  const items = markets.map((market) => {
    const positive = market.changePercent >= 0
    return {
      slug: market.slug,
      question: market.title,
      chance: `${formatProbabilityPercent(market.probability)}%`,
      change: `${positive ? "↗" : "↘"}${positive ? "+" : ""}${market.changePercent.toFixed(1)}%`,
      positive,
    }
  })
  const loop = [...items, ...items]

  return (
    <div className="bg-surface-white border-outline-variant landing-ticker-wrap my-8 border-y py-2 dark:border-on-secondary-container">
      <div className="landing-ticker-track font-data text-data-mono text-slate-text">
        {loop.map((item, index) => (
          <Link
            key={`${item.slug}-${index}`}
            href={`/markets/${item.slug}`}
            className="mx-4 hover:underline"
          >
            {item.question}{" "}
            <span className="text-on-surface font-semibold">{item.chance}</span>{" "}
            <span
              className={
                item.positive ? "text-success-green" : "text-danger-red"
              }
            >
              {item.change}
            </span>
            <span className="mx-4">•</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

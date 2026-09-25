import { Footer } from "@/components/polymarket/landing/footer"
import { Header } from "@/components/polymarket/landing/header"
import { DatePills } from "@/components/polymarket/market-detail/date-pills"
import { Discussion } from "@/components/polymarket/market-detail/discussion"
import { MarketHeader } from "@/components/polymarket/market-detail/market-header"
import { OrderBook } from "@/components/polymarket/market-detail/order-book"
import { PriceChart } from "@/components/polymarket/market-detail/price-chart"
import { RelatedMarkets } from "@/components/polymarket/market-detail/related-markets"
import { RulesPanel } from "@/components/polymarket/market-detail/rules-panel"
import { TradePanel } from "@/components/polymarket/market-detail/trade-panel"
import { formatProbabilityPercent } from "@/components/polymarket/markets/data"
import type { OutcomeType, TradeSide } from "@/lib/polymarket/db-types"
import type { MarketDetail, PositionView } from "@/lib/polymarket/markets/queries"

export function MarketDetailView({
  market,
  signedIn,
  positions,
  initialSide,
  initialOutcome,
}: {
  market: MarketDetail
  signedIn: boolean
  positions: PositionView[]
  initialSide: TradeSide
  initialOutcome: OutcomeType
}) {
  const chance = formatProbabilityPercent(market.yesPrice)

  return (
    <div className="bg-surface font-label text-body-md text-on-surface dark:bg-surface-dim min-h-svh antialiased">
      <Header activeNav="markets" />
      <div className="pt-20">
        <main className="mx-auto grid max-w-(--spacing-container-max) gap-6 px-(--spacing-margin-mobile) py-6 md:px-(--spacing-margin-desktop) lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="min-w-0">
            <MarketHeader market={market} />
            <DatePills siblings={market.siblings} activeSlug={market.slug} />
            <PriceChart
              history={market.history}
              chance={chance}
              changePercent={market.changePercent}
              volume={market.volume}
              resolutionDate={market.resolutionDate}
            />
            <OrderBook levels={market.orderBook} />
            <RulesPanel
              description={market.description}
              context={market.context}
            />
            <Discussion
              marketId={market.id}
              comments={market.comments}
              holders={market.holders}
              activity={market.activity}
              positions={positions}
              signedIn={signedIn}
            />
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <TradePanel
              market={market}
              signedIn={signedIn}
              initialSide={initialSide}
              initialOutcome={initialOutcome}
            />
            <RelatedMarkets markets={market.related} />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}

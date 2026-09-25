import { ArrowRight } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { MarketCard } from "@/components/polymarket/markets/market-card"
import { Link } from "@/lib/polymarket/routing"
import { listFeaturedMarketCards } from "@/lib/polymarket/markets/queries"

import { SectionShell } from "./section-shell"

export async function FeaturedMarkets() {
  const t = await getTranslations("FeaturedMarkets")
  const markets = await listFeaturedMarketCards(4)

  return (
    <SectionShell>
      <section className="mb-20">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h3 className="font-label text-label-caps text-secondary mb-2 uppercase">
              {t("trendingNow")}
            </h3>
            <h2 className="font-headline text-headline-lg text-on-surface">
              {t("title")}
            </h2>
          </div>
          <Link
            href="/markets"
            className="font-label text-body-sm text-primary dark:text-primary-fixed-dim flex items-center gap-1 hover:underline"
          >
            {t("viewAll")}
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {markets.length === 0 ? (
            <p className="text-on-surface-variant dark:text-secondary-fixed-dim font-label text-body-sm col-span-full py-12 text-center">
              {t("title")} — no open markets yet.
            </p>
          ) : (
            markets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))
          )}
        </div>
      </section>
    </SectionShell>
  )
}

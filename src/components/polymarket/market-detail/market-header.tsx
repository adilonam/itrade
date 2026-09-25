import { getTranslations } from "next-intl/server"

import { ShareActions } from "@/components/polymarket/market-detail/share-actions"
import { MarketThumb } from "@/components/polymarket/markets/market-thumb"
import { Link } from "@/lib/polymarket/routing"
import type { MarketDetail } from "@/lib/polymarket/markets/queries"

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export async function MarketHeader({ market }: { market: MarketDetail }) {
  const t = await getTranslations("MarketDetail")
  const crumb = market.subcategory ?? market.tags[0] ?? market.category

  return (
    <div className="mb-4">
      <nav className="text-secondary mb-3 flex flex-wrap items-center gap-1 text-xs">
        <Link href="/markets" className="hover:text-primary hover:underline">
          {t("markets")}
        </Link>
        <span>/</span>
        <Link
          href={`/markets?category=${market.category}`}
          className="hover:text-primary hover:underline"
        >
          {titleCase(market.category)}
        </Link>
        {crumb && crumb !== market.category ? (
          <>
            <span>/</span>
            <span className="text-on-surface">{titleCase(crumb)}</span>
          </>
        ) : null}
      </nav>

      <div className="flex items-start gap-3">
        <MarketThumb
          src={market.imageUrl}
          label={market.iconLabel ?? market.category.slice(0, 2).toUpperCase()}
          size={48}
          className="size-12 rounded-lg"
        />
        <h1 className="font-headline text-headline-lg-mobile md:text-headline-lg text-on-surface min-w-0 flex-1 font-semibold">
          {market.title}
        </h1>
        <ShareActions />
      </div>
    </div>
  )
}

import { getTranslations } from "next-intl/server"

import { categoryHref } from "@/components/polymarket/markets/params"
import { Link } from "@/lib/polymarket/routing"
import { countMarketsByCategory } from "@/lib/polymarket/markets/queries"
import type { MarketCategory } from "@/lib/polymarket/db-types"

import { SectionShell } from "./section-shell"

const categoryKeys: MarketCategory[] = [
  "politics",
  "crypto",
  "sports",
  "finance",
  "tech",
  "entertainment",
  "world",
]

export async function CategoryExplore() {
  const t = await getTranslations("CategoryExplore")
  const tSubNav = await getTranslations("SubNav")
  const counts = await countMarketsByCategory()
  const countMap = new Map(counts.map((row) => [row.category, row.count]))

  return (
    <SectionShell>
      <section className="mb-24">
        <h2 className="font-headline text-headline-lg-mobile text-on-surface mb-6">
          {t("title")}
        </h2>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
          {categoryKeys.map((category) => (
            <Link
              key={category}
              href={categoryHref(category)}
              className="bg-surface-white border-outline-variant hover:border-primary flex flex-col items-center justify-center rounded-xl border p-4 text-center transition-colors dark:hover:border-primary-fixed-dim"
            >
              <span className="font-label text-body-md text-on-surface mb-1 font-semibold">
                {tSubNav(category)}
              </span>
              <span className="font-data text-data-mono text-secondary text-xs">
                {t("marketsCount", { count: countMap.get(category) ?? 0 })}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </SectionShell>
  )
}

import { Suspense } from "react"

import { Footer } from "@/components/polymarket/landing/footer"
import { Header } from "@/components/polymarket/landing/header"
import { SubNav } from "@/components/polymarket/landing/sub-nav"

import type { MarketListItem } from "./data"
import { MarketsBrowse } from "./markets-browse"

function SubNavFallback() {
  return (
    <div className="bg-surface-white dark:bg-on-secondary-fixed border-outline-variant dark:border-on-secondary-container hidden h-12 w-full border-b md:block" />
  )
}

export function MarketsPage({ markets }: { markets: MarketListItem[] }) {
  const updatedAt = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date())

  return (
    <div className="bg-surface font-label text-body-md text-on-surface dark:bg-surface-dim min-h-svh antialiased">
      <Header activeNav="markets" />
      <div className="pt-20">
        <Suspense fallback={<SubNavFallback />}>
          <SubNav />
        </Suspense>
        <main>
          <Suspense fallback={null}>
            <MarketsBrowse markets={markets} updatedAt={updatedAt} />
          </Suspense>
        </main>
        <Footer />
      </div>
    </div>
  )
}

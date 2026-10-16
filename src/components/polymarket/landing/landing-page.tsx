import { Suspense } from "react"

import { CategoryExplore } from "./category-explore"
import { FeaturedMarkets } from "./featured-markets"
import { Footer } from "./footer"
import { Header } from "./header"
import { HeroSection } from "./hero-section"
import { MarketTicker } from "./market-ticker"
import { NotificationBanner } from "./notification-banner"
import { PromoBanner } from "./promo-banner"
import { SubNav } from "./sub-nav"

function SubNavFallback() {
  return (
    <div className="bg-surface-white dark:bg-on-secondary-fixed border-outline-variant dark:border-on-secondary-container hidden h-12 w-full border-b md:block" />
  )
}

export function LandingPage() {
  return (
    <div className="bg-surface font-label text-body-md text-on-surface dark:bg-surface-dim min-h-svh antialiased">
      <Header />
      <div className="pt-20">
        <Suspense fallback={<SubNavFallback />}>
          <SubNav />
        </Suspense>
        <main className="pb-24">
          <HeroSection />
          <MarketTicker />
          <NotificationBanner />
          <FeaturedMarkets />
          <CategoryExplore />
          <PromoBanner />
        </main>
        <Footer />
      </div>
    </div>
  )
}

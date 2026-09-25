import { Suspense } from "react"

import { Footer } from "@/components/polymarket/landing/footer"
import { Header } from "@/components/polymarket/landing/header"
import { SubNav } from "@/components/polymarket/landing/sub-nav"

function SubNavFallback() {
  return (
    <div className="bg-surface-white dark:bg-on-secondary-fixed border-outline-variant dark:border-on-secondary-container hidden h-12 w-full border-b md:block" />
  )
}

type ContentPageProps = {
  children: React.ReactNode
}

export function ContentPage({ children }: ContentPageProps) {
  return (
    <div className="bg-surface font-label text-body-md text-on-surface dark:bg-surface-dim min-h-svh antialiased">
      <Header activeNav={null} />
      <div className="pt-20">
        <Suspense fallback={<SubNavFallback />}>
          <SubNav />
        </Suspense>
        <main>{children}</main>
        <Footer />
      </div>
    </div>
  )
}

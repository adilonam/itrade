import { Footer } from "@/components/polymarket/landing/footer"
import { Header } from "@/components/polymarket/landing/header"

import { AuthMarketingPanel } from "./auth-marketing-panel"

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="bg-surface font-label text-body-md text-on-surface dark:bg-surface-dim flex min-h-svh flex-col overflow-x-hidden antialiased">
      <Header activeNav={null} />
      <div className="relative flex flex-1 flex-col pt-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -start-32 top-24 size-96 rounded-full bg-blue-200/50 blur-3xl dark:bg-blue-900/25" />
          <div className="absolute -end-32 bottom-32 size-96 rounded-full bg-pink-200/50 blur-3xl dark:bg-pink-900/20" />
          <div className="absolute start-1/3 top-1/2 size-64 rounded-full bg-blue-100/40 blur-3xl dark:bg-primary-container/10" />
        </div>

        <main className="relative mx-auto flex w-full max-w-(--spacing-container-max) flex-1 flex-col items-center gap-10 px-(--spacing-margin-mobile) py-10 md:px-(--spacing-margin-desktop) lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-16">
          <AuthMarketingPanel />
          <div className="flex w-full justify-center lg:justify-end">
            {children}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}

import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Link } from "@/lib/polymarket/routing"

import { HERO_STATS } from "./data"
import { SectionShell } from "./section-shell"

const accentClasses = {
  "primary-container":
    "text-primary-container dark:text-primary-fixed-dim",
  "slate-text": "text-slate-text dark:text-primary-fixed-dim",
  "danger-red": "text-danger-red",
} as const

const statKeys = [
  "volume24h",
  "openMarkets",
  "activeTraders",
  "avgSpread",
] as const

export async function HeroSection() {
  const t = await getTranslations("Hero")

  return (
    <SectionShell className="dark:bg-surface-dim">
      <section className="relative grid items-center gap-12 overflow-hidden py-16 md:grid-cols-2 md:py-24">
        <div className="from-surface-white absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br to-blue-50/50 dark:from-surface-dim dark:via-surface-container-low dark:to-[#1a2744]/80" />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden rounded-3xl dark:block"
        >
          <div className="border-primary-container/10 absolute start-1/2 top-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border" />
          <div className="border-primary-container/15 absolute start-1/2 top-1/2 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border" />
          <div className="border-primary-container/20 absolute start-1/2 top-1/2 size-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full border" />
          <div className="bg-primary-container/10 absolute start-1/2 top-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />
        </div>

        <div className="z-10 space-y-8">
          <div className="font-label text-label-caps text-slate-text bg-surface-container-highest inline-flex items-center gap-2 rounded-full px-3 py-1.5 dark:bg-surface-container-high/80 dark:text-secondary-fixed-dim">
            <span className="bg-success-green size-2 rounded-full" />
            {t("badge")}
          </div>

          <h1 className="font-headline text-headline-xl text-on-surface dark:text-inverse-on-surface">
            {t.rich("titleLine1", {
              future: (chunks) => (
                <span className="text-primary-container dark:bg-gradient-to-r dark:from-primary-fixed-dim dark:to-tertiary-fixed-dim dark:bg-clip-text dark:text-transparent">
                  {chunks}
                </span>
              ),
            })}
            <br />
            {t("titleLine2")}
            <br />
            {t("titleLine3")}
          </h1>

          <p className="font-label text-body-md text-slate-text max-w-lg dark:text-secondary-fixed-dim">
            {t("description")}
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/markets"
              className="font-label text-label-caps bg-primary-container hover:bg-primary flex items-center gap-2 rounded-lg px-6 py-3 text-white transition-colors"
            >
              {t("exploreMarkets")}
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="#"
              className="font-label text-label-caps text-slate-text border-outline-variant hover:bg-surface-container-low bg-surface-white rounded-lg border px-6 py-3 transition-colors dark:border-outline dark:bg-transparent dark:text-inverse-on-surface dark:hover:bg-surface-container-high/60"
            >
              {t("howItWorks")}
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-8 md:grid-cols-4">
            {HERO_STATS.map((stat, index) => (
              <div
                key={stat.label}
                className="bg-surface-white border-outline-variant rounded-xl border p-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)] dark:border-primary-container/25 dark:border-b-primary-container dark:bg-surface-container/50 dark:shadow-[0_4px_12px_rgba(0,0,0,0.35)] dark:backdrop-blur-sm"
              >
                <div className="font-label text-label-caps text-on-surface-variant mb-1 dark:text-secondary-fixed-dim">
                  {t(`stats.${statKeys[index]}`)}
                </div>
                <div
                  className={`font-data text-data-mono text-lg ${accentClasses[stat.accent]}`}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex justify-center">
          <Image
            src="/polymarket/landing/hero-superhero.png"
            alt={t("heroImageAlt")}
            width={640}
            height={640}
            className="h-auto max-w-full drop-shadow-2xl"
            priority
          />

          <div className="bg-surface-white/90 border-outline-variant absolute end-2 bottom-10 max-w-[220px] animate-bounce rounded-xl border p-4 shadow-lg backdrop-blur-md dark:border-primary-container/30 dark:bg-surface-container-high/90">
            <div className="text-on-surface-variant mb-1 flex items-center gap-1 text-[10px] font-bold uppercase">
              <span className="bg-success-green size-1.5 rounded-full" />
              {t("liveMarket")}
            </div>
            <div className="font-label text-body-sm text-on-surface mb-2 line-clamp-2 font-semibold">
              {t("liveMarketTitle")}
            </div>
            <div className="font-data text-data-mono flex gap-2 text-xs">
              <span className="text-success-green bg-success-green/10 rounded px-2 py-0.5">
                YES 42¢
              </span>
              <span className="text-danger-red bg-danger-red/10 rounded px-2 py-0.5">
                NO 58¢
              </span>
            </div>
          </div>
        </div>
      </section>
    </SectionShell>
  )
}

import { getTranslations } from "next-intl/server"

import { SectionShell } from "@/components/polymarket/landing/section-shell"

import { ABOUT_STATS } from "./data"

const statKeys = ["founded", "activeTraders", "volume24h"] as const

export async function AboutStats() {
  const t = await getTranslations("About.stats")

  return (
    <SectionShell>
      <div className="mb-20 grid gap-6 md:grid-cols-3">
        {ABOUT_STATS.map((stat, index) => {
          const statKey = statKeys[index]!
          return (
          <div
            key={stat.value}
            className="bg-surface-white border-outline-variant rounded-xl border p-8 text-center shadow-[0_4px_12px_rgba(0,0,0,0.02)] dark:border-primary-container/25 dark:bg-surface-container/50 dark:shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
          >
            <div className="font-headline text-headline-xl text-primary-container dark:text-primary-fixed-dim mb-2">
              {stat.value}
            </div>
            <div className="font-label text-label-caps text-on-surface-variant dark:text-secondary-fixed-dim">
              {t(statKey)}
            </div>
          </div>
          )
        })}
      </div>
    </SectionShell>
  )
}

import { Shield } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Logo } from "@/components/polymarket/landing/logo"

const STATS = [
  { value: "$32M", key: "volume" as const },
  { value: "280+", key: "markets" as const },
  { value: "0.4%", key: "spread" as const },
]

export async function AuthMarketingPanel() {
  const t = await getTranslations("Auth")

  return (
    <div className="hidden w-full max-w-lg space-y-8 lg:block">
      <Logo className="mb-2" />

      <div className="space-y-4">
        <h1 className="font-headline text-headline-xl text-on-surface dark:text-inverse-on-surface leading-tight">
          {t("headline1")}
          <br />
          <span className="from-primary-container via-primary to-danger-red bg-gradient-to-r bg-clip-text text-transparent dark:from-primary-fixed-dim dark:via-primary-fixed dark:to-tertiary-fixed-dim">
            {t("headline2")}
          </span>
        </h1>
        <p className="text-secondary dark:text-secondary-fixed-dim max-w-md text-base leading-relaxed">
          {t("subtext")}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {STATS.map((stat) => (
          <div
            key={stat.key}
            className="bg-surface-white dark:bg-surface-container-low border-outline-variant/50 dark:border-on-secondary-container min-w-[120px] rounded-xl border px-4 py-3 shadow-sm"
          >
            <p className="font-headline text-primary-container dark:text-primary-fixed-dim text-xl font-bold">
              {stat.value}
            </p>
            <p className="text-on-surface-variant dark:text-secondary-fixed-dim mt-0.5 text-[10px] font-medium tracking-wider uppercase">
              {t(`stats.${stat.key}`)}
            </p>
          </div>
        ))}
      </div>

      <div className="text-secondary dark:text-secondary-fixed-dim flex items-center gap-2 text-sm">
        <Shield className="text-primary-container dark:text-primary-fixed-dim size-4 shrink-0" />
        <span>{t("trust")}</span>
      </div>
    </div>
  )
}

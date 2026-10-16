import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Link } from "@/lib/polymarket/routing"

import { PROMO_STATS } from "./data"
import { SectionShell } from "./section-shell"

const promoStatKeys = ["maxPayout", "settlement", "depositFee"] as const

export async function PromoBanner() {
  const t = await getTranslations("PromoBanner")

  return (
    <SectionShell>
      <section className="bg-surface-white border-outline-variant relative mb-24 overflow-hidden rounded-3xl border shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <div className="relative z-10 grid items-center p-8 md:grid-cols-2 md:p-16">
          <div className="space-y-6">
            <div className="font-label text-success-green bg-success-green/10 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px]">
              <span className="bg-success-green size-1.5 rounded-full" />
              {t("badge")}
            </div>

            <h2 className="font-headline text-headline-xl text-on-surface">
              <span className="text-success-green">{t("titleYes")}</span>{" "}
              {t("titleOr")}{" "}
              <span className="text-danger-red">{t("titleNo")}</span>.
              <br />
              <span className="text-primary-container">{t("titleProfit")}</span>
            </h2>

            <p className="font-label text-body-md text-slate-text max-w-md">
              {t("description")}
            </p>

            <div className="flex gap-4">
              <Link
                href="#"
                className="font-label text-label-caps bg-primary-container hover:bg-primary flex items-center gap-2 rounded-lg px-6 py-3 text-white transition-colors"
              >
                {t("startTrading")}
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="#"
                className="font-label text-label-caps text-slate-text border-outline-variant hover:bg-surface-variant bg-surface rounded-lg border px-6 py-3 transition-colors"
              >
                {t("howPayoutsWork")}
              </Link>
            </div>

            <div className="flex gap-4 pt-4">
              {PROMO_STATS.map((stat, index) => (
                <div
                  key={stat.label}
                  className="bg-surface border-outline-variant flex-1 rounded-lg border p-3"
                >
                  <div className="font-data text-data-mono text-primary-container">
                    {stat.value}
                  </div>
                  <div className="font-label text-label-caps text-secondary mt-1 text-[10px] uppercase">
                    {t(`stats.${promoStatKeys[index]}`)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute top-0 end-0 bottom-0 z-0 hidden w-1/2 opacity-80 md:block">
          <Image
            src="/polymarket/landing/promo-superhero.png"
            alt={t("imageAlt")}
            fill
            sizes="(max-width: 768px) 0px, 50vw"
            className="object-cover object-left"
          />
          <div className="from-surface-white via-surface-white/50 absolute inset-0 bg-gradient-to-r to-transparent dark:from-surface-container dark:via-surface-container/80" />
        </div>
      </section>
    </SectionShell>
  )
}

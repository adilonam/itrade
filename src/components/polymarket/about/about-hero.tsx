import Image from "next/image"
import { getTranslations } from "next-intl/server"

import { SectionShell } from "@/components/polymarket/landing/section-shell"

export async function AboutHero() {
  const t = await getTranslations("About")

  return (
    <SectionShell className="dark:bg-surface-dim">
      <section className="relative grid items-center gap-12 overflow-hidden py-16 md:grid-cols-2 md:py-24">
        <div className="from-surface-white absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br to-blue-50/50 dark:from-surface-dim dark:via-surface-container-low dark:to-[#1a2744]/80" />

        <div className="z-10 space-y-6">
          <p className="font-label text-label-caps text-slate-text dark:text-secondary-fixed-dim">
            {t("storyLabel")}
          </p>

          <h1 className="font-headline text-headline-xl text-on-surface dark:text-inverse-on-surface max-w-xl">
            {t("title")}
          </h1>

          <div className="font-label text-body-md text-slate-text dark:text-secondary-fixed-dim space-y-4 max-w-lg">
            <p>{t("paragraph1")}</p>
            <p>{t("paragraph2")}</p>
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
        </div>
      </section>
    </SectionShell>
  )
}

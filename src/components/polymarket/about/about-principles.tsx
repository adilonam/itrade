import { getTranslations } from "next-intl/server"

import { SectionShell } from "@/components/polymarket/landing/section-shell"

const principleKeys = ["transparency", "tradersFirst", "localGlobal"] as const

export async function AboutPrinciples() {
  const t = await getTranslations("About")

  return (
    <SectionShell>
      <section className="pb-24">
        <h2 className="font-headline text-headline-lg text-on-surface dark:text-inverse-on-surface mb-8">
          {t("principlesTitle")}
        </h2>

        <div className="space-y-4">
          {principleKeys.map((key) => (
            <div
              key={key}
              className="bg-surface-white border-outline-variant rounded-xl border p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)] dark:border-primary-container/25 dark:bg-surface-container/50 dark:shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
            >
              <h3 className="font-label text-body-md text-on-surface dark:text-inverse-on-surface mb-2 font-semibold">
                {t(`principles.${key}.title`)}
              </h3>
              <p className="font-label text-body-sm text-slate-text dark:text-secondary-fixed-dim">
                {t(`principles.${key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </SectionShell>
  )
}

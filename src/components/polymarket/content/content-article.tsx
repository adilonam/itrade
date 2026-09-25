import { getTranslations } from "next-intl/server"

import { SectionShell } from "@/components/polymarket/landing/section-shell"

type ContentArticleProps = {
  namespace:
    | "HowItWorks"
    | "Fees"
    | "Liquidity"
    | "Api"
    | "Careers"
    | "Press"
    | "Contact"
    | "Disclaimer"
    | "Terms"
}

export async function ContentArticle({ namespace }: ContentArticleProps) {
  const t = await getTranslations(namespace)

  return (
    <SectionShell className="dark:bg-surface-dim">
      <article className="relative max-w-2xl space-y-6 overflow-hidden py-16 md:py-24">
        <div className="from-surface-white absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br to-blue-50/50 dark:from-surface-dim dark:via-surface-container-low dark:to-[#1a2744]/80" />

        <p className="font-label text-label-caps text-slate-text dark:text-secondary-fixed-dim">
          {t("label")}
        </p>

        <h1 className="font-headline text-headline-xl text-on-surface dark:text-inverse-on-surface">
          {t("title")}
        </h1>

        <div className="font-label text-body-md text-slate-text dark:text-secondary-fixed-dim space-y-4">
          <p>{t("paragraph1")}</p>
          <p>{t("paragraph2")}</p>
          <p>{t("paragraph3")}</p>
        </div>
      </article>
    </SectionShell>
  )
}

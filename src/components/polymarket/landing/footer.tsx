import { getTranslations } from "next-intl/server"

import { categoryHref } from "@/components/polymarket/markets/params"
import { Link } from "@/lib/polymarket/routing"

import { Logo } from "./logo"

const FOOTER_MARKET_KEYS = [
  "politics",
  "crypto",
  "sports",
  "finance",
  "tech",
] as const

const FOOTER_PLATFORM_LINKS = [
  { key: "howItWorks", href: "/how-it-works" },
  { key: "fees", href: "/fees" },
  { key: "liquidity", href: "/liquidity" },
  { key: "api", href: "/api" },
] as const

const FOOTER_COMPANY_LINKS = [
  { key: "about", href: "/about" },
  { key: "careers", href: "/careers" },
  { key: "press", href: "/press" },
  { key: "contact", href: "/contact" },
  { key: "disclaimer", href: "/disclaimer" },
  { key: "terms", href: "/terms" },
] as const

export async function Footer() {
  const t = await getTranslations("Footer")

  return (
    <footer className="bg-surface-container-low dark:bg-on-secondary-fixed border-outline-variant dark:border-on-secondary-container mt-auto border-t">
      <div className="text-body-sm text-on-surface dark:text-surface-white mx-auto grid w-full max-w-(--spacing-container-max) grid-cols-2 gap-(--spacing-gutter) px-(--spacing-margin-desktop) py-(--spacing-stack-lg) md:grid-cols-4 lg:grid-cols-5">
        <div className="col-span-2 space-y-4 lg:col-span-2">
          <Logo />
          <p className="text-secondary dark:text-secondary-fixed-dim max-w-xs text-xs leading-relaxed">
            {t("copyright")}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="font-label text-label-caps text-secondary mb-2">
            {t("markets")}
          </h4>
          {FOOTER_MARKET_KEYS.map((key) => (
            <Link
              key={key}
              href={categoryHref(key)}
              className="text-secondary dark:text-secondary-fixed-dim hover:text-on-surface dark:hover:text-surface-white transition-all hover:underline"
            >
              {t(`links.${key}`)}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="font-label text-label-caps text-secondary mb-2">
            {t("platform")}
          </h4>
          {FOOTER_PLATFORM_LINKS.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className="text-secondary dark:text-secondary-fixed-dim hover:text-on-surface dark:hover:text-surface-white transition-all hover:underline"
            >
              {t(`links.${key}`)}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="font-label text-label-caps text-secondary mb-2">
            {t("company")}
          </h4>
          {FOOTER_COMPANY_LINKS.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className="text-secondary dark:text-secondary-fixed-dim hover:text-on-surface dark:hover:text-surface-white transition-all hover:underline"
            >
              {t(`links.${key}`)}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}

"use client"

import { useTranslations } from "next-intl"

import { Input } from "@/components/polymarket/ui/input"

import { SectionShell } from "@/components/polymarket/landing/section-shell"

type MarketsHeaderProps = {
  count: number
  volume: string
  search: string
  onSearchChange: (value: string) => void
  updatedAt: string
}

export function MarketsHeader({
  count,
  volume,
  search,
  onSearchChange,
  updatedAt,
}: MarketsHeaderProps) {
  const t = useTranslations("Markets")

  return (
    <SectionShell className="pt-10 pb-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="font-label text-label-caps text-primary dark:text-primary-fixed-dim mb-2 flex items-center gap-2">
            <span className="bg-success-green size-2 rounded-full" />
            {t("liveMarkets")}
          </div>
          <h1 className="font-headline text-headline-xl text-on-surface dark:text-inverse-on-surface mb-2">
            {t("title")}
          </h1>
          <p className="font-label text-body-sm text-slate-text dark:text-secondary-fixed-dim">
            {t("stats", {
              count,
              volume,
              time: updatedAt,
            })}
          </p>
        </div>

        <div className="w-full max-w-sm">
          <Input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="bg-surface-white border-outline-variant dark:border-on-secondary-container h-10 rounded-full px-4 dark:bg-surface-container-high/60"
            aria-label={t("searchPlaceholder")}
          />
        </div>
      </div>
    </SectionShell>
  )
}

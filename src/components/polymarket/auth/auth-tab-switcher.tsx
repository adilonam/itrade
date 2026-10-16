"use client"

import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"

import { Link, usePathname } from "@/lib/polymarket/routing"

type AuthMode = "sign-in" | "sign-up"

type AuthTabSwitcherProps = {
  mode: AuthMode
}

export function AuthTabSwitcher({ mode }: AuthTabSwitcherProps) {
  const t = useTranslations("Auth.tabs")
  const pathname = usePathname()

  const tabs: { key: AuthMode; href: "/sign-in" | "/sign-up"; label: string }[] =
    [
      { key: "sign-in", href: "/sign-in", label: t("signIn") },
      { key: "sign-up", href: "/sign-up", label: t("signUp") },
    ]

  return (
    <div className="bg-surface-container-low dark:bg-surface-container-high/60 mb-6 flex rounded-full p-1">
      {tabs.map((tab) => {
        const isActive = mode === tab.key || pathname.endsWith(tab.href)

        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={cn(
              "flex-1 rounded-full px-4 py-2 text-center text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-surface-white dark:bg-on-secondary-fixed text-on-surface shadow-sm"
                : "text-on-surface-variant dark:text-secondary-fixed-dim hover:text-on-surface dark:hover:text-surface-white"
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}

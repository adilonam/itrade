import { getTranslations } from "next-intl/server"

import { auth } from "@/lib/polymarket/auth-session"
import { isPolymarketAdmin } from "@/lib/polymarket/roles"
import { cn } from "@/lib/utils"

import { Link } from "@/lib/polymarket/routing"

import { BalanceCard } from "@/components/polymarket/auth/balance-card"
import { UserMenu } from "@/components/polymarket/auth/user-menu"

import { LanguageDropdown } from "./language-dropdown"
import { Logo } from "./logo"
import { ThemeToggle } from "./theme-toggle"

const NAV_ITEMS = [
  { key: "home" as const, href: "/" },
  { key: "about" as const, href: "/about" },
  { key: "markets" as const, href: "/markets" },
] as const

const ADMIN_NAV_ITEMS = [
  { key: "marketsAdmin" as const, href: "/admin/market" },
  { key: "generateMarketAdmin" as const, href: "/admin/generate-market" },
  { key: "tradesAdmin" as const, href: "/admin/trades" },
  { key: "usersAdmin" as const, href: "/admin/users" },
  { key: "profitAdmin" as const, href: "/admin/profit" },
  { key: "payoutsAdmin" as const, href: "/admin/payouts" },
] as const

export type ActiveNav =
  | (typeof NAV_ITEMS)[number]["key"]
  | (typeof ADMIN_NAV_ITEMS)[number]["key"]

type HeaderProps = {
  activeNav?: ActiveNav | null
}

export async function Header({ activeNav = "home" }: HeaderProps) {
  const [t, session] = await Promise.all([
    getTranslations("Header"),
    auth(),
  ])
  const isAdmin = isPolymarketAdmin(session?.user?.role)
  const navItems = isAdmin ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS] : NAV_ITEMS

  return (
    <nav className="bg-surface-white dark:bg-on-secondary-fixed fixed inset-x-0 top-0 z-50 w-full border-b border-outline-variant dark:border-on-secondary-container">
      <div className="mx-auto flex h-20 max-w-(--spacing-container-max) items-center justify-between gap-6 px-(--spacing-margin-mobile) md:px-(--spacing-margin-desktop)">
        <div className="flex min-w-0 items-center gap-6">
          <Logo className="shrink-0" />
          <div className="hidden min-w-0 shrink items-center gap-6 overflow-x-auto overflow-y-hidden whitespace-nowrap font-label text-label-caps md:flex [scrollbar-width:thin] [scrollbar-color:var(--color-outline-variant)_transparent] dark:[scrollbar-color:var(--color-on-secondary-container)_transparent] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-outline-variant dark:[&::-webkit-scrollbar-thumb]:bg-on-secondary-container">
            {navItems.map((link) => {
              const isActive = link.key === activeNav

              return (
                <Link
                  key={link.key}
                  href={link.href}
                  className={cn(
                    "shrink-0 transition-colors duration-200",
                    isActive && activeNav === "home"
                      ? "text-primary dark:text-primary-fixed-dim border-primary dark:border-primary-fixed-dim border-b-2 pb-1 pt-1"
                      : isActive
                        ? "text-primary dark:text-primary-fixed-dim bg-surface-container-low dark:bg-surface-container-high/60 rounded px-2 py-1 font-medium"
                        : "text-on-surface-variant dark:text-secondary-fixed-dim hover:text-primary dark:hover:text-primary-fixed-dim hover:bg-surface-container-low dark:hover:bg-on-secondary-fixed-variant rounded px-2 py-1"
                  )}
                >
                  {t(`nav.${link.key}`)}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 md:gap-4">
          <LanguageDropdown />
          <ThemeToggle />
          <BalanceCard />
          <UserMenu />
        </div>
      </div>
    </nav>
  )
}

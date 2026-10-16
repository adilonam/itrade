"use client"

import { LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/polymarket/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const menuItemClassName =
  "text-on-surface hover:bg-surface-container-low dark:text-inverse-on-surface dark:hover:bg-on-secondary-fixed-variant flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition-colors"

type UserAvatarMenuProps = {
  name?: string | null
  email?: string | null
  image?: string | null
}

function getInitials(name?: string | null, email?: string | null) {
  const trimmedName = name?.trim()
  if (trimmedName) {
    const parts = trimmedName.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase()
    }
    return trimmedName.slice(0, 2).toUpperCase()
  }

  const trimmedEmail = email?.trim()
  if (trimmedEmail) {
    return trimmedEmail.slice(0, 1).toUpperCase()
  }

  return "?"
}

export function UserAvatarMenu({
  name,
  email,
  image,
}: UserAvatarMenuProps) {
  const t = useTranslations("Auth.userMenu")
  const [isSigningOut, setIsSigningOut] = useState(false)
  const initials = getInitials(name, email)

  async function handleSignOut() {
    setIsSigningOut(true)
    try {
      await signOut({ callbackUrl: "/" })
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-outline-variant bg-transparent transition-colors outline-none dark:border-on-secondary-container",
          "hover:bg-surface-container-low focus-visible:ring-3 focus-visible:ring-ring/30 dark:hover:bg-on-secondary-fixed-variant"
        )}
        aria-label={t("openMenu")}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center bg-primary-container text-xs font-semibold text-white">
            {initials}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="min-w-56 border border-outline-variant bg-surface-white p-2 text-on-surface shadow-xl ring-0 dark:border-on-secondary-container dark:bg-on-secondary-fixed dark:text-inverse-on-surface"
      >
        <div className="space-y-0.5 px-2 py-2">
          {name?.trim() ? (
            <p className="truncate text-sm font-semibold text-on-surface dark:text-inverse-on-surface">
              {name.trim()}
            </p>
          ) : null}
          {email?.trim() ? (
            <p className="truncate text-xs text-on-surface-variant dark:text-secondary-fixed-dim">
              {email.trim()}
            </p>
          ) : null}
        </div>

        <DropdownMenuSeparator className="bg-outline-variant dark:bg-on-secondary-container" />

        <div className="p-1">
          <button
            type="button"
            className={cn(
              menuItemClassName,
              "disabled:pointer-events-none disabled:opacity-50"
            )}
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut className="size-4 shrink-0" />
            {isSigningOut ? t("signingOut") : t("signOut")}
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

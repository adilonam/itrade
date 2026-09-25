import { cn } from "@/lib/utils"

import { AuthTabSwitcher } from "./auth-tab-switcher"

type AuthMode = "sign-in" | "sign-up"

type AuthCardProps = {
  mode: AuthMode
  children: React.ReactNode
  className?: string
}

export function AuthCard({ mode, children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "bg-surface-white dark:bg-on-secondary-fixed border-outline-variant/40 dark:border-on-secondary-container w-full max-w-md rounded-2xl border p-6 shadow-lg md:p-8",
        className
      )}
    >
      <AuthTabSwitcher mode={mode} />
      {children}
    </div>
  )
}

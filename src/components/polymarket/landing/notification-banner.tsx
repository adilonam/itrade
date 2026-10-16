"use client"

import { Bell, X } from "lucide-react"
import { useTranslations } from "next-intl"
import * as React from "react"

export function NotificationBanner() {
  const t = useTranslations("NotificationBanner")
  const [visible, setVisible] = React.useState(true)

  if (!visible) {
    return null
  }

  return (
    <div className="bg-surface-white border-outline-variant mx-auto mb-16 flex max-w-(--spacing-container-max) items-center justify-between rounded-xl border p-4 px-(--spacing-margin-mobile) shadow-[0_4px_12px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.25)] md:px-(--spacing-margin-desktop)">
      <div className="flex items-center gap-3">
        <Bell className="text-secondary size-5" />
        <div>
          <div className="font-label text-body-md text-on-surface font-semibold">
            {t("title")}
          </div>
          <div className="font-label text-body-sm text-secondary">
            {t("message")}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="text-secondary hover:text-on-surface transition-colors"
        aria-label={t("dismiss")}
      >
        <X className="size-5" />
      </button>
    </div>
  )
}

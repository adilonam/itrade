"use client"

import { useEffect } from "react"

import { TRADE_BALANCE_CHANGE_EVENT } from "@/lib/balance-selection"
import { useRouter } from "@/lib/polymarket/routing"

/** Refresh server components when the global trade balance mode changes. */
export function RefreshOnBalanceChange() {
  const router = useRouter()

  useEffect(() => {
    const onChange = () => {
      router.refresh()
    }
    window.addEventListener(TRADE_BALANCE_CHANGE_EVENT, onChange)
    return () => {
      window.removeEventListener(TRADE_BALANCE_CHANGE_EVENT, onChange)
    }
  }, [router])

  return null
}

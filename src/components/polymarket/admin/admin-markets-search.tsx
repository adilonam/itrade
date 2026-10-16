"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useRouter } from "@/lib/polymarket/routing"

import { Button } from "@/components/polymarket/ui/button"
import { Input } from "@/components/polymarket/ui/input"

type AdminMarketsSearchProps = {
  query: string
}

export function AdminMarketsSearch({ query }: AdminMarketsSearchProps) {
  const t = useTranslations("Admin")
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(query)

  useEffect(() => {
    setValue(query)
  }, [query])

  function applySearch(nextQuery: string) {
    const params = new URLSearchParams(searchParams.toString())
    const trimmed = nextQuery.trim()
    if (trimmed) {
      params.set("q", trimmed)
    } else {
      params.delete("q")
    }
    // New search always starts on page 1.
    params.delete("page")
    const qs = params.toString()
    router.push(qs ? `/admin/market?${qs}` : "/admin/market")
  }

  function clearSearch() {
    setValue("")
    applySearch("")
  }

  return (
    <form
      className="border-outline-variant bg-surface-container-low flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center"
      onSubmit={(event) => {
        event.preventDefault()
        applySearch(value)
      }}
    >
      <label className="sr-only" htmlFor="admin-markets-search">
        {t("marketsSearchLabel")}
      </label>
      <Input
        id="admin-markets-search"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t("marketsSearchPlaceholder")}
        className="border-outline-variant bg-surface h-10 min-w-0 flex-1 px-3 placeholder:text-muted-foreground"
        autoComplete="off"
      />
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button
          type="submit"
          size="sm"
          className="bg-primary-container hover:bg-primary text-white"
        >
          {t("marketsSearchSubmit")}
        </Button>
        {query ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSearch}
          >
            {t("marketsSearchClear")}
          </Button>
        ) : null}
      </div>
    </form>
  )
}

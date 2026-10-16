"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useRouter } from "@/lib/polymarket/routing"

import { Button } from "@/components/polymarket/ui/button"
import { Input } from "@/components/polymarket/ui/input"

type AdminUsersSearchProps = {
  query: string
}

export function AdminUsersSearch({ query }: AdminUsersSearchProps) {
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
    router.push(qs ? `/admin/users?${qs}` : "/admin/users")
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
      <label className="sr-only" htmlFor="admin-users-search">
        {t("usersSearchLabel")}
      </label>
      <Input
        id="admin-users-search"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t("usersSearchPlaceholder")}
        className="border-outline-variant bg-surface h-10 min-w-0 flex-1 px-3 placeholder:text-muted-foreground"
        autoComplete="off"
      />
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button
          type="submit"
          size="sm"
          className="bg-primary-container hover:bg-primary text-white"
        >
          {t("usersSearchSubmit")}
        </Button>
        {query ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSearch}
          >
            {t("usersSearchClear")}
          </Button>
        ) : null}
      </div>
    </form>
  )
}

"use client"

import { useState, useTransition } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/lib/polymarket/routing"

import { Badge } from "@/components/polymarket/ui/badge"
import { Button } from "@/components/polymarket/ui/button"
import { Input } from "@/components/polymarket/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/polymarket/ui/table"
import {
  adjustAdminUserBalance,
  updateAdminUserProfile,
  updateAdminUserRole,
} from "@/lib/polymarket/admin/user-actions"
import type { AdminUserListItem } from "@/lib/polymarket/admin/user-queries"
import { UserRole } from "@/lib/polymarket/db-types"
import { cn } from "@/lib/utils"

function formatMoney(value: number): string {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatTime(iso: string): string {
  // Fixed locale + UTC so SSR and client produce the same string (avoids hydration mismatch).
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  })
}

function displayName(user: AdminUserListItem): string {
  return user.name?.trim() || user.username?.trim() || user.email
}

type BalanceMode = "set" | "adjust"

export function AdminUserTable({
  users,
  searchQuery = "",
}: {
  users: AdminUserListItem[]
  searchQuery?: string
}) {
  const t = useTranslations("Admin")
  const router = useRouter()
  const { data: session, update } = useSession()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)
  const [pending, startTransition] = useTransition()

  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [role, setRole] = useState<UserRole>(UserRole.user)
  const [balanceMode, setBalanceMode] = useState<BalanceMode>("set")
  const [balanceValue, setBalanceValue] = useState("")
  const [balanceNote, setBalanceNote] = useState("")

  function openEditor(user: AdminUserListItem) {
    setEditingId(user.id)
    setName(user.name ?? "")
    setUsername(user.username ?? "")
    setRole(
      user.role === UserRole.admin || user.role === 'SUPERADMIN'
        ? UserRole.admin
        : UserRole.user
    )
    setBalanceMode("set")
    setBalanceValue(user.predictionBalance.toFixed(2))
    setBalanceNote("")
    setMessage(null)
  }

  function closeEditor() {
    setEditingId(null)
    setMessage(null)
  }

  function showError(key: string) {
    const errorKey = key as
      | "unauthenticated"
      | "forbidden"
      | "invalid"
      | "not_found"
      | "last_admin"
      | "username_taken"
      | "negative_balance"
    setMessage({ type: "error", text: t(`usersErrors.${errorKey}`) })
  }

  function refreshAfterChange(sessionUserAffected: boolean) {
    startTransition(async () => {
      if (sessionUserAffected) {
        await update()
      }
      router.refresh()
    })
  }

  function saveProfile(userId: string) {
    setMessage(null)
    startTransition(async () => {
      const result = await updateAdminUserProfile({
        userId,
        name,
        username,
      })
      if (!result.ok) {
        showError(result.error)
        return
      }
      setMessage({ type: "success", text: t("usersSavedProfile") })
      router.refresh()
    })
  }

  function saveRole(userId: string) {
    setMessage(null)
    startTransition(async () => {
      const result = await updateAdminUserRole({ userId, role })
      if (!result.ok) {
        showError(result.error)
        return
      }
      setMessage({ type: "success", text: t("usersSavedRole") })
      if (session?.user?.id === userId) {
        await update()
      }
      router.refresh()
    })
  }

  function saveBalance(userId: string) {
    setMessage(null)
    const parsed = Number(balanceValue)
    if (!Number.isFinite(parsed)) {
      showError("invalid")
      return
    }

    startTransition(async () => {
      const result =
        balanceMode === "set"
          ? await adjustAdminUserBalance({
              userId,
              mode: "set",
              value: parsed,
              note: balanceNote || undefined,
            })
          : await adjustAdminUserBalance({
              userId,
              mode: "adjust",
              amount: parsed,
              note: balanceNote || undefined,
            })

      if (!result.ok) {
        showError(result.error)
        return
      }

      setMessage({
        type: "success",
        text: t("usersSavedBalance", { balance: formatMoney(result.balance) }),
      })
      setBalanceValue(
        balanceMode === "set" ? result.balance.toFixed(2) : ""
      )
      setBalanceNote("")
      refreshAfterChange(result.sessionUserAffected)
    })
  }

  if (users.length === 0) {
    const isFiltered = searchQuery.trim().length > 0
    return (
      <div className="border-outline-variant bg-surface-container-low rounded-xl border px-6 py-12 text-center">
        <p className="text-on-surface font-medium">
          {isFiltered ? t("usersEmptySearchTitle") : t("usersEmptyTitle")}
        </p>
        <p className="text-on-surface-variant mt-1 text-sm">
          {isFiltered
            ? t("usersEmptySearchDescription")
            : t("usersEmptyDescription")}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {message ? (
        <p
          className={cn(
            "rounded-lg px-4 py-3 text-sm",
            message.type === "success"
              ? "bg-surface-container-low text-on-surface"
              : "bg-danger-red/10 text-danger-red"
          )}
          role="status"
        >
          {message.text}
        </p>
      ) : null}

      <div className="border-outline-variant overflow-hidden rounded-xl border">
        <Table>
          <TableHeader className="bg-surface-container-low border-outline-variant [&_tr]:border-outline-variant">
            <TableRow className="border-outline-variant hover:bg-transparent">
              <TableHead className="text-on-surface h-auto px-4 py-3 font-semibold">
                {t("usersColUser")}
              </TableHead>
              <TableHead className="text-on-surface hidden h-auto px-4 py-3 font-semibold md:table-cell">
                {t("usersColEmail")}
              </TableHead>
              <TableHead className="text-on-surface h-auto px-4 py-3 font-semibold">
                {t("usersColRole")}
              </TableHead>
              <TableHead className="text-on-surface h-auto px-4 py-3 font-semibold">
                {t("usersColBalance")}
              </TableHead>
              <TableHead className="text-on-surface hidden h-auto px-4 py-3 font-semibold lg:table-cell">
                {t("usersColCreated")}
              </TableHead>
              <TableHead className="text-on-surface h-auto px-4 py-3 text-right font-semibold">
                {t("usersColActions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isEditing = editingId === user.id
              const busy = pending && isEditing

              return (
                <TableRow
                  key={user.id}
                  className="border-outline-variant hover:bg-transparent align-top"
                >
                  <TableCell
                    className="px-4 py-3 whitespace-normal"
                    colSpan={isEditing ? 6 : 1}
                  >
                    {!isEditing ? (
                      <>
                        <p className="max-w-[14rem] truncate font-medium">
                          {displayName(user)}
                        </p>
                        {user.username ? (
                          <p className="text-on-surface-variant mt-0.5 text-xs">
                            @{user.username}
                          </p>
                        ) : null}
                        <p className="text-on-surface-variant mt-0.5 max-w-[14rem] truncate text-xs md:hidden">
                          {user.email}
                        </p>
                      </>
                    ) : (
                      <div className="space-y-4 py-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{displayName(user)}</p>
                            <p className="text-on-surface-variant text-xs">
                              {user.email}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={closeEditor}
                          >
                            {t("usersCancel")}
                          </Button>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-3">
                          <section className="border-outline-variant space-y-3 rounded-xl border p-4">
                            <h3 className="text-sm font-semibold">
                              {t("usersEditProfile")}
                            </h3>
                            <label className="block space-y-1.5">
                              <span className="text-on-surface-variant text-xs font-medium">
                                {t("usersFieldName")}
                              </span>
                              <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={busy}
                                autoComplete="off"
                              />
                            </label>
                            <label className="block space-y-1.5">
                              <span className="text-on-surface-variant text-xs font-medium">
                                {t("usersFieldUsername")}
                              </span>
                              <Input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={busy}
                                autoComplete="off"
                                placeholder="trader_01"
                              />
                            </label>
                            <Button
                              type="button"
                              size="sm"
                              disabled={busy}
                              onClick={() => saveProfile(user.id)}
                              className="bg-primary-container hover:bg-primary text-white"
                            >
                              {busy ? "…" : t("usersSaveProfile")}
                            </Button>
                          </section>

                          <section className="border-outline-variant space-y-3 rounded-xl border p-4">
                            <h3 className="text-sm font-semibold">
                              {t("usersEditRole")}
                            </h3>
                            <label className="block space-y-1.5">
                              <span className="text-on-surface-variant text-xs font-medium">
                                {t("usersFieldRole")}
                              </span>
                              <select
                                className="border-outline-variant bg-surface h-9 w-full rounded-2xl border px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                                value={role}
                                disabled={busy}
                                onChange={(e) =>
                                  setRole(e.target.value as UserRole)
                                }
                              >
                                <option value={UserRole.user}>
                                  {t("usersRoleUser")}
                                </option>
                                <option value={UserRole.admin}>
                                  {t("usersRoleAdmin")}
                                </option>
                              </select>
                            </label>
                            <Button
                              type="button"
                              size="sm"
                              disabled={busy}
                              onClick={() => saveRole(user.id)}
                              className="bg-primary-container hover:bg-primary text-white"
                            >
                              {busy ? "…" : t("usersSaveRole")}
                            </Button>
                          </section>

                          <section className="border-outline-variant space-y-3 rounded-xl border p-4">
                            <h3 className="text-sm font-semibold">
                              {t("usersEditBalance")}
                            </h3>
                            <p className="text-on-surface-variant text-xs">
                              {t("usersCurrentBalance", {
                                balance: formatMoney(user.predictionBalance),
                              })}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant={
                                  balanceMode === "set" ? "default" : "outline"
                                }
                                disabled={busy}
                                onClick={() => {
                                  setBalanceMode("set")
                                  setBalanceValue(user.predictionBalance.toFixed(2))
                                }}
                                className={
                                  balanceMode === "set"
                                    ? "bg-primary-container hover:bg-primary text-white"
                                    : "border-outline-variant bg-surface-container text-on-surface hover:bg-surface-container-high dark:bg-surface-container dark:hover:bg-surface-container-high"
                                }
                              >
                                {t("usersBalanceSet")}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={
                                  balanceMode === "adjust"
                                    ? "default"
                                    : "outline"
                                }
                                disabled={busy}
                                onClick={() => {
                                  setBalanceMode("adjust")
                                  setBalanceValue("")
                                }}
                                className={
                                  balanceMode === "adjust"
                                    ? "bg-primary-container hover:bg-primary text-white"
                                    : "border-outline-variant bg-surface-container text-on-surface hover:bg-surface-container-high dark:bg-surface-container dark:hover:bg-surface-container-high"
                                }
                              >
                                {t("usersBalanceAdjust")}
                              </Button>
                            </div>
                            <label className="block space-y-1.5">
                              <span className="text-on-surface-variant text-xs font-medium">
                                {balanceMode === "set"
                                  ? t("usersFieldBalanceSet")
                                  : t("usersFieldBalanceAdjust")}
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                value={balanceValue}
                                onChange={(e) =>
                                  setBalanceValue(e.target.value)
                                }
                                disabled={busy}
                                placeholder={
                                  balanceMode === "adjust" ? "+100 or -50" : "0.00"
                                }
                              />
                            </label>
                            <label className="block space-y-1.5">
                              <span className="text-on-surface-variant text-xs font-medium">
                                {t("usersFieldNote")}
                              </span>
                              <Input
                                value={balanceNote}
                                onChange={(e) =>
                                  setBalanceNote(e.target.value)
                                }
                                disabled={busy}
                                placeholder={t("usersNotePlaceholder")}
                              />
                            </label>
                            <Button
                              type="button"
                              size="sm"
                              disabled={busy}
                              onClick={() => saveBalance(user.id)}
                              className="bg-primary-container hover:bg-primary text-white"
                            >
                              {busy ? "…" : t("usersSaveBalance")}
                            </Button>
                          </section>
                        </div>
                      </div>
                    )}
                  </TableCell>

                  {!isEditing ? (
                    <>
                      <TableCell className="text-on-surface-variant hidden px-4 py-3 md:table-cell">
                        <span className="block max-w-[16rem] truncate">
                          {user.email}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-normal">
                        <Badge
                          variant="outline"
                          className={cn(
                            "capitalize",
                            user.role === UserRole.admin
                              ? "border-primary/40 bg-primary/15 text-primary dark:text-primary-fixed-dim"
                              : "border-outline-variant bg-surface-container text-on-surface"
                          )}
                        >
                          {user.role === UserRole.admin
                            ? t("usersRoleAdmin")
                            : t("usersRoleUser")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-data px-4 py-3 tabular-nums">
                        {formatMoney(user.predictionBalance)}
                      </TableCell>
                      <TableCell className="text-on-surface-variant hidden px-4 py-3 whitespace-nowrap lg:table-cell">
                        <time dateTime={user.createdAt} suppressHydrationWarning>
                          {formatTime(user.createdAt)}
                        </time>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => openEditor(user)}
                        >
                          {t("usersEdit")}
                        </Button>
                      </TableCell>
                    </>
                  ) : null}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

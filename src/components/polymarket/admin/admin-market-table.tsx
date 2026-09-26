"use client"

import { useState, useTransition } from "react"
import { TriangleAlert } from "lucide-react"
import { useTranslations } from "next-intl"
import { Link, useRouter } from "@/lib/polymarket/routing"
import { useSession } from "next-auth/react"

import {
  MarketFormFields,
  datetimeLocalToIso,
  emptyMarketFormValues,
  noPriceFromYes,
  parseTags,
  toDatetimeLocal,
  type MarketFormValues,
} from "@/components/polymarket/admin/generate-market/market-form-fields"
import { Badge } from "@/components/polymarket/ui/badge"
import { Button, buttonVariants } from "@/components/polymarket/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/polymarket/ui/dialog"
import { Label } from "@/components/polymarket/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/polymarket/ui/table"
import {
  deleteMarketAction,
  upsertMarketAction,
} from "@/lib/polymarket/admin/generate-market-actions"
import { MARKET_CATEGORIES } from "@/lib/polymarket/admin/generate-market-schema"
import type { AdminMarketListItem } from "@/lib/polymarket/markets/queries"
import { MarketStatus, OutcomeType } from "@/lib/polymarket/db-types"
import { resolveMarket } from "@/lib/polymarket/markets/actions"
import { cn } from "@/lib/utils"

function canResolveMarket(market: AdminMarketListItem): boolean {
  return (
    market.status === MarketStatus.open ||
    (market.status === MarketStatus.resolved && market.winningOutcome == null)
  )
}

function needsDecision(market: AdminMarketListItem): boolean {
  return (
    market.status === MarketStatus.resolved && market.winningOutcome == null
  )
}

function isPastDue(market: AdminMarketListItem): boolean {
  return (
    market.status === MarketStatus.open &&
    new Date(market.resolutionDate).getTime() < Date.now()
  )
}

type ResolveConfirm = {
  market: AdminMarketListItem
  outcome: OutcomeType
}

function formatProfit(value: number): string {
  const abs = Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return value < 0 ? `-$${abs}` : `$${abs}`
}

function formatDueAt(iso: string): string {
  // Fixed locale + UTC so SSR and client produce the same string (avoids hydration mismatch).
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  })
}

/** Portaled dialog surfaces sit outside `.polymarket-root` — set dark tokens explicitly. */
const adminDialogContentClassName =
  "border border-outline-variant bg-surface-white text-on-surface ring-outline-variant dark:border-on-secondary-container dark:bg-on-secondary-fixed dark:text-inverse-on-surface dark:ring-on-secondary-container [&_[data-slot=dialog-close]]:dark:bg-on-secondary-fixed-variant [&_[data-slot=dialog-close]]:dark:text-inverse-on-surface [&_[data-slot=dialog-close]]:dark:hover:bg-on-secondary-container"

const adminDialogMutedClassName =
  "text-on-surface-variant dark:text-secondary-fixed-dim"

const adminDialogCancelClassName =
  "border-outline-variant bg-surface-white text-on-surface hover:bg-surface-container-low dark:border-on-secondary-container dark:bg-transparent dark:text-inverse-on-surface dark:hover:bg-on-secondary-fixed-variant"

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== "string") {
        reject(new Error("read_failed"))
        return
      }
      const comma = result.indexOf(",")
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(reader.error ?? new Error("read_failed"))
    reader.readAsDataURL(file)
  })
}

function marketToFormValues(market: AdminMarketListItem): MarketFormValues {
  return {
    title: market.title,
    description: market.description,
    context: market.context ?? "",
    category: market.category,
    resolutionDate: toDatetimeLocal(new Date(market.resolutionDate)),
    dateLabel: market.dateLabel ?? "",
    tags: market.tags.join(", "),
    iconLabel: market.iconLabel ?? "",
    yesPrice: market.yesPrice.toFixed(2),
  }
}

function ProfitLine({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <p
      className={cn(
        "font-data text-xs tabular-nums",
        value > 0
          ? "text-success-green"
          : value < 0
            ? "text-danger-red"
            : "text-on-surface-variant dark:text-secondary-fixed-dim"
      )}
    >
      {label}: {formatProfit(value)}
    </p>
  )
}

export function AdminMarketTable({
  markets,
  searchQuery = "",
}: {
  markets: AdminMarketListItem[]
  searchQuery?: string
}) {
  const t = useTranslations("Admin")
  const router = useRouter()
  const { update } = useSession()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<ResolveConfirm | null>(null)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [editing, setEditing] = useState<AdminMarketListItem | null>(null)
  const [editValues, setEditValues] = useState<MarketFormValues>(
    emptyMarketFormValues()
  )
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [clearImage, setClearImage] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<AdminMarketListItem | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const categoryLabels = Object.fromEntries(
    MARKET_CATEGORIES.map((c) => [c, t(`generateCategory.${c}`)])
  ) as Record<(typeof MARKET_CATEGORIES)[number], string>

  const fieldLabels = {
    title: t("generateFieldTitle"),
    description: t("generateFieldDescription"),
    context: t("generateFieldContext"),
    category: t("generateFieldCategory"),
    resolutionDate: t("generateFieldResolution"),
    dateLabel: t("generateFieldDateLabel"),
    tags: t("generateFieldTags"),
    tagsHint: t("generateFieldTagsHint"),
    iconLabel: t("generateFieldIcon"),
    yesPrice: t("generateFieldYesPrice"),
    noPrice: t("generateFieldNoPrice"),
  }

  if (markets.length === 0) {
    const isFiltered = searchQuery.trim().length > 0
    return (
      <div className="border-outline-variant bg-surface-container-low rounded-xl border px-6 py-12 text-center">
        <p className="text-on-surface font-medium">
          {isFiltered ? t("marketsEmptySearchTitle") : t("marketsEmptyTitle")}
        </p>
        <p className="text-on-surface-variant mt-1 text-sm">
          {isFiltered
            ? t("marketsEmptySearchDescription")
            : t("marketsEmptyDescription")}
        </p>
      </div>
    )
  }

  function openConfirm(market: AdminMarketListItem, outcome: OutcomeType) {
    setDialogError(null)
    setConfirm({ market, outcome })
  }

  function closeConfirm() {
    if (pending) return
    setConfirm(null)
    setDialogError(null)
  }

  function openEdit(market: AdminMarketListItem) {
    setEditing(market)
    setEditValues(marketToFormValues(market))
    setImageFile(null)
    setClearImage(false)
    setEditError(null)
  }

  function closeEdit() {
    if (pending) return
    setEditing(null)
    setImageFile(null)
    setClearImage(false)
    setEditError(null)
  }

  function openDelete(market: AdminMarketListItem) {
    setDeleting(market)
    setDeleteError(null)
  }

  function closeDelete() {
    if (pending) return
    setDeleting(null)
    setDeleteError(null)
  }

  function confirmResolve() {
    if (!confirm) return

    const { market, outcome } = confirm
    setPendingId(market.id)
    setMessage(null)
    setDialogError(null)

    startTransition(async () => {
      const result = await resolveMarket({
        marketId: market.id,
        winningOutcome: outcome,
      })
      setPendingId(null)

      if (!result.ok) {
        setDialogError(t(`resolveErrors.${result.error}`))
        return
      }

      setConfirm(null)
      setMessage(
        t("resolveSuccess", {
          count: result.winnersPaid,
          amount: result.totalPayout.toFixed(2),
        })
      )
      await update()
      router.refresh()
    })
  }

  function confirmEdit() {
    if (!editing) return

    setPendingId(editing.id)
    setMessage(null)
    setEditError(null)

    startTransition(async () => {
      const yes = Number.parseFloat(editValues.yesPrice)
      if (!Number.isFinite(yes)) {
        setEditError(t("generateErrors.invalid"))
        setPendingId(null)
        return
      }

      let imageBase64: string | null = null
      let imageMimeType: string | null = null
      if (imageFile) {
        try {
          imageBase64 = await fileToBase64(imageFile)
          imageMimeType = imageFile.type
        } catch {
          setEditError(t("generateErrors.invalid_image"))
          setPendingId(null)
          return
        }
      }

      const result = await upsertMarketAction({
        id: editing.id,
        title: editValues.title,
        description: editValues.description,
        context: editValues.context || undefined,
        category: editValues.category,
        resolutionDate: datetimeLocalToIso(editValues.resolutionDate),
        dateLabel: editValues.dateLabel || undefined,
        tags: parseTags(editValues.tags),
        iconLabel: editValues.iconLabel || undefined,
        yesPrice: yes,
        noPrice: noPriceFromYes(yes),
        imageBase64,
        imageMimeType,
        clearImage,
      })

      setPendingId(null)

      if (!result.ok) {
        setEditError(t(`generateErrors.${result.error}`))
        return
      }

      setEditing(null)
      setImageFile(null)
      setClearImage(false)
      setMessage(t("marketsEditSuccess"))
      router.refresh()
    })
  }

  function confirmDelete() {
    if (!deleting) return

    setPendingId(deleting.id)
    setMessage(null)
    setDeleteError(null)

    startTransition(async () => {
      const result = await deleteMarketAction(deleting.id)
      setPendingId(null)

      if (!result.ok) {
        setDeleteError(t(`generateErrors.${result.error}`))
        return
      }

      setDeleting(null)
      setMessage(t("marketsDeleteSuccess"))
      router.refresh()
    })
  }

  const confirmOutcomeLabel =
    confirm?.outcome === OutcomeType.YES ? t("profitYes") : t("profitNo")
  const confirmProfit =
    confirm?.outcome === OutcomeType.YES
      ? confirm?.market.profitIfYes
      : confirm?.market.profitIfNo
  const confirmProfitReal =
    confirm?.outcome === OutcomeType.YES
      ? confirm?.market.profitIfYesReal
      : confirm?.market.profitIfNoReal
  const confirmProfitDemo =
    confirm?.outcome === OutcomeType.YES
      ? confirm?.market.profitIfYesDemo
      : confirm?.market.profitIfNoDemo
  const confirmBusy = pending && pendingId === confirm?.market.id
  const editBusy = pending && pendingId === editing?.id
  const deleteBusy = pending && pendingId === deleting?.id

  return (
    <div className="space-y-4">
      {message ? (
        <p className="bg-surface-container-low text-on-surface rounded-lg px-4 py-3 text-sm">
          {message}
        </p>
      ) : null}

      <div className="border-outline-variant overflow-hidden rounded-xl border">
        <Table>
          <TableHeader className="bg-surface-container-low border-outline-variant [&_tr]:border-outline-variant">
            <TableRow className="border-outline-variant hover:bg-transparent">
              <TableHead className="text-on-surface h-auto px-4 py-3 font-semibold">
                Market
              </TableHead>
              <TableHead className="text-on-surface h-auto px-4 py-3 font-semibold">
                Status
              </TableHead>
              <TableHead className="text-on-surface hidden h-auto px-4 py-3 font-semibold md:table-cell">
                Category
              </TableHead>
              <TableHead className="text-on-surface hidden h-auto px-4 py-3 font-semibold md:table-cell">
                {t("marketsColDueAt")}
              </TableHead>
              <TableHead className="text-on-surface hidden h-auto px-4 py-3 font-semibold lg:table-cell">
                Volume
              </TableHead>
              <TableHead className="text-on-surface hidden h-auto px-4 py-3 font-semibold lg:table-cell">
                {t("profitColumn")}
              </TableHead>
              <TableHead className="text-on-surface h-auto px-4 py-3 text-right font-semibold">
                Resolve
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {markets.map((market) => {
              const busy = pending && pendingId === market.id
              const resolvable = canResolveMarket(market)
              const awaitingDecision = needsDecision(market)
              const pastDue = isPastDue(market)
              const editable = market.status === MarketStatus.open
              return (
                <TableRow
                  key={market.id}
                  className={cn(
                    "border-outline-variant hover:bg-transparent",
                    awaitingDecision && "bg-danger-red/5"
                  )}
                >
                  <TableCell className="px-4 py-3 whitespace-normal">
                    <p className="max-w-md font-medium">
                      <Link
                        href={`/markets/${market.slug}`}
                        className="hover:text-primary hover:underline"
                      >
                        {market.title}
                      </Link>
                    </p>
                    <p className="text-on-surface-variant mt-0.5 text-xs">
                      {market.slug}
                    </p>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-normal">
                    <div className="flex flex-col items-start gap-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          market.status === MarketStatus.open
                            ? "border-primary/40 bg-primary/15 text-primary dark:text-primary-fixed-dim"
                            : awaitingDecision
                              ? "border-danger-red/50 bg-danger-red/15 text-danger-red"
                              : "border-outline-variant bg-surface-container text-on-surface capitalize"
                        )}
                      >
                        {awaitingDecision ? (
                          <span className="inline-flex items-center gap-1">
                            <TriangleAlert
                              className="size-3.5 shrink-0"
                              aria-hidden
                            />
                            {t("marketsNeedsDecision")}
                          </span>
                        ) : market.status === MarketStatus.resolved ? (
                          t("marketsStatusResolved", {
                            outcome: market.winningOutcome ?? "",
                          })
                        ) : (
                          t("marketsStatusOpen")
                        )}
                      </Badge>
                      {pastDue ? (
                        <span
                          className="text-tertiary dark:text-tertiary-fixed-dim text-xs font-medium"
                          suppressHydrationWarning
                        >
                          {t("marketsPastDue")}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-on-surface-variant hidden px-4 py-3 capitalize md:table-cell">
                    {market.category}
                  </TableCell>
                  <TableCell className="text-on-surface-variant hidden px-4 py-3 md:table-cell">
                    <time
                      dateTime={market.resolutionDate}
                      className={cn(
                        "font-data text-sm tabular-nums",
                        pastDue && "text-tertiary dark:text-tertiary-fixed-dim"
                      )}
                      suppressHydrationWarning
                    >
                      {formatDueAt(market.resolutionDate)}
                    </time>
                  </TableCell>
                  <TableCell className="text-on-surface-variant hidden px-4 py-3 lg:table-cell">
                    ${Math.round(market.totalVolume).toLocaleString()}
                  </TableCell>
                  <TableCell className="hidden space-y-1 px-4 py-3 whitespace-normal lg:table-cell">
                    <div className="space-y-0.5">
                      <ProfitLine
                        label={t("profitYes")}
                        value={market.profitIfYes}
                      />
                      <p className="text-on-surface-variant font-data pl-0.5 text-[10px] tabular-nums">
                        {t("profitBalanceBreakdown", {
                          real: formatProfit(market.profitIfYesReal),
                          demo: formatProfit(market.profitIfYesDemo),
                        })}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <ProfitLine
                        label={t("profitNo")}
                        value={market.profitIfNo}
                      />
                      <p className="text-on-surface-variant font-data pl-0.5 text-[10px] tabular-nums">
                        {t("profitBalanceBreakdown", {
                          real: formatProfit(market.profitIfNoReal),
                          demo: formatProfit(market.profitIfNoDemo),
                        })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-normal">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Link
                        href={`/admin/trades?marketId=${market.id}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" })
                        )}
                      >
                        {t("tradesLink")}
                      </Link>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy || !editable}
                        className="border-on-surface/40 text-on-surface hover:bg-on-surface/10"
                        onClick={() => openEdit(market)}
                      >
                        {t("marketsEdit")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={busy}
                        onClick={() => openDelete(market)}
                      >
                        {t("marketsDelete")}
                      </Button>
                      {resolvable ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            className="border-success-green text-success-green hover:bg-success-green/10"
                            onClick={() => openConfirm(market, OutcomeType.YES)}
                          >
                            {busy ? "…" : t("profitYes")}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            className="border-danger-red text-danger-red hover:bg-danger-red/10"
                            onClick={() => openConfirm(market, OutcomeType.NO)}
                          >
                            {busy ? "…" : t("profitNo")}
                          </Button>
                        </>
                      ) : (
                        <p className="text-on-surface-variant text-xs">
                          {t("marketsSettled")}
                        </p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={confirm !== null}
        disablePointerDismissal={confirmBusy}
        onOpenChange={(open) => {
          if (!open) closeConfirm()
        }}
      >
        <DialogContent
          showCloseButton={!confirmBusy}
          className={adminDialogContentClassName}
        >
          <DialogHeader>
            <DialogTitle className="dark:text-inverse-on-surface">
              {t("resolveConfirmTitle", { outcome: confirmOutcomeLabel })}
            </DialogTitle>
            <DialogDescription className={adminDialogMutedClassName}>
              {t("resolveConfirmBody")}
            </DialogDescription>
          </DialogHeader>

          {confirm ? (
            <div className="space-y-3">
              <p className="font-medium dark:text-inverse-on-surface">
                {confirm.market.title}
              </p>
              {confirmProfit !== undefined &&
              confirmProfitReal !== undefined &&
              confirmProfitDemo !== undefined ? (
                <div className="bg-surface-container-low dark:bg-on-secondary-fixed-variant border-outline-variant dark:border-on-secondary-container space-y-2 rounded-lg border px-3 py-3">
                  <p
                    className={cn(
                      "text-xs font-semibold tracking-wide uppercase",
                      adminDialogMutedClassName
                    )}
                  >
                    {t("resolveConfirmCasinoHeading")}
                  </p>
                  <ProfitLine
                    label={t("resolveConfirmProfitReal")}
                    value={confirmProfitReal}
                  />
                  <ProfitLine
                    label={t("resolveConfirmProfitDemo")}
                    value={confirmProfitDemo}
                  />
                  <p
                    className={cn(
                      "font-data border-outline-variant dark:border-on-secondary-container border-t pt-2 text-sm font-semibold tabular-nums",
                      confirmProfit > 0
                        ? "text-success-green"
                        : confirmProfit < 0
                          ? "text-danger-red"
                          : adminDialogMutedClassName
                    )}
                  >
                    {t("resolveConfirmProfit", {
                      outcome: confirmOutcomeLabel,
                      profit: formatProfit(confirmProfit),
                    })}
                  </p>
                </div>
              ) : null}
              {dialogError ? (
                <p className="text-danger-red text-sm" role="alert">
                  {dialogError}
                </p>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={confirmBusy}
              className={adminDialogCancelClassName}
              onClick={closeConfirm}
            >
              {t("resolveCancel")}
            </Button>
            <Button
              type="button"
              disabled={confirmBusy}
              className={
                confirm?.outcome === OutcomeType.YES
                  ? "bg-success-green text-white hover:bg-success-green/90"
                  : "bg-danger-red text-white hover:bg-danger-red/90"
              }
              onClick={confirmResolve}
            >
              {confirmBusy ? t("resolveConfirming") : t("resolveConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editing !== null}
        disablePointerDismissal={editBusy}
        onOpenChange={(open) => {
          if (!open) closeEdit()
        }}
      >
        <DialogContent
          showCloseButton={!editBusy}
          className={cn(adminDialogContentClassName, "max-h-[90vh] overflow-y-auto sm:max-w-xl")}
        >
          <DialogHeader>
            <DialogTitle className="dark:text-inverse-on-surface">
              {t("marketsEditTitle")}
            </DialogTitle>
            <DialogDescription className={adminDialogMutedClassName}>
              {t("marketsEditDescription")}
            </DialogDescription>
          </DialogHeader>

          {editing ? (
            <div className="space-y-4">
              <MarketFormFields
                values={editValues}
                disabled={editBusy}
                labels={fieldLabels}
                categoryLabels={categoryLabels}
                onChange={setEditValues}
              />

              <div className="space-y-2">
                <Label htmlFor="admin-market-image">
                  {t("generateImageLabel")}
                </Label>
                <input
                  id="admin-market-image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  disabled={editBusy}
                  className="text-sm text-muted-foreground file:mr-3 file:rounded-2xl file:border-0 file:bg-primary-container file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-primary"
                  onChange={(e) => {
                    setImageFile(e.target.files?.[0] ?? null)
                    setClearImage(false)
                  }}
                />
                {editing.imageUrl && !clearImage && !imageFile ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editing.imageUrl}
                      alt=""
                      className="size-12 rounded-lg object-cover"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={editBusy}
                      onClick={() => setClearImage(true)}
                    >
                      {t("generateImageClear")}
                    </Button>
                  </div>
                ) : null}
              </div>

              {editError ? (
                <p className="text-danger-red text-sm" role="alert">
                  {editError}
                </p>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={editBusy}
              className={adminDialogCancelClassName}
              onClick={closeEdit}
            >
              {t("resolveCancel")}
            </Button>
            <Button
              type="button"
              disabled={editBusy}
              className="bg-primary-container hover:bg-primary text-white"
              onClick={confirmEdit}
            >
              {editBusy ? t("generateSaving") : t("marketsEditSave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleting !== null}
        disablePointerDismissal={deleteBusy}
        onOpenChange={(open) => {
          if (!open) closeDelete()
        }}
      >
        <DialogContent
          showCloseButton={!deleteBusy}
          className={adminDialogContentClassName}
        >
          <DialogHeader>
            <DialogTitle className="dark:text-inverse-on-surface">
              {t("marketsDeleteTitle")}
            </DialogTitle>
            <DialogDescription className={adminDialogMutedClassName}>
              {t("marketsDeleteBody")}
            </DialogDescription>
          </DialogHeader>

          {deleting ? (
            <div className="space-y-2">
              <p className="font-medium dark:text-inverse-on-surface">
                {deleting.title}
              </p>
              {deleting.tradeCount > 0 ? (
                <p className="text-danger-red text-sm" role="status">
                  {t("marketsDeleteHasTrades", {
                    count: deleting.tradeCount,
                  })}
                </p>
              ) : null}
              {deleteError ? (
                <p className="text-danger-red text-sm" role="alert">
                  {deleteError}
                </p>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deleteBusy}
              className={adminDialogCancelClassName}
              onClick={closeDelete}
            >
              {t("resolveCancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteBusy}
              onClick={confirmDelete}
            >
              {deleteBusy ? t("marketsDeleting") : t("marketsDeleteConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

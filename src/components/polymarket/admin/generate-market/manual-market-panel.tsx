"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/polymarket/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/polymarket/ui/card"
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
  MarketFormFields,
  datetimeLocalToIso,
  emptyMarketFormValues,
  noPriceFromYes,
  parseTags,
  toDatetimeLocal,
  type MarketFormValues,
} from "@/components/polymarket/admin/generate-market/market-form-fields"
import {
  deleteMarketAction,
  upsertMarketAction,
} from "@/lib/polymarket/admin/generate-market-actions"
import type { ManageableMarket } from "@/lib/polymarket/admin/generate-market-queries"
import { MARKET_CATEGORIES } from "@/lib/polymarket/admin/generate-market-schema"
import { MarketStatus } from "@/lib/polymarket/db-types"
import { Link, useRouter } from "@/lib/polymarket/routing"

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

function marketToFormValues(market: ManageableMarket): MarketFormValues {
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

export function ManualMarketPanel({
  markets,
}: {
  markets: ManageableMarket[]
}) {
  const t = useTranslations("Admin")
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [values, setValues] = useState<MarketFormValues>(emptyMarketFormValues())
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [clearImage, setClearImage] = useState(false)
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

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

  const editingMarket = editingId
    ? markets.find((m) => m.id === editingId)
    : null

  function showError(key: string) {
    setMessage({
      type: "error",
      text: t(`generateErrors.${key}` as "generateErrors.invalid"),
    })
  }

  function startCreate() {
    setEditingId(null)
    setValues(emptyMarketFormValues())
    setImageFile(null)
    setClearImage(false)
    setMessage(null)
  }

  function startEdit(market: ManageableMarket) {
    setEditingId(market.id)
    setValues(marketToFormValues(market))
    setImageFile(null)
    setClearImage(false)
    setMessage(null)
  }

  function handleSave() {
    setMessage(null)
    startTransition(async () => {
      const yes = Number.parseFloat(values.yesPrice)
      if (!Number.isFinite(yes)) {
        showError("invalid")
        return
      }

      let imageBase64: string | null = null
      let imageMimeType: string | null = null
      if (imageFile) {
        try {
          imageBase64 = await fileToBase64(imageFile)
          imageMimeType = imageFile.type
        } catch {
          showError("invalid_image")
          return
        }
      }

      const result = await upsertMarketAction({
        id: editingId ?? undefined,
        title: values.title,
        description: values.description,
        context: values.context || undefined,
        category: values.category,
        resolutionDate: datetimeLocalToIso(values.resolutionDate),
        dateLabel: values.dateLabel || undefined,
        tags: parseTags(values.tags),
        iconLabel: values.iconLabel || undefined,
        yesPrice: yes,
        noPrice: noPriceFromYes(yes),
        imageBase64,
        imageMimeType,
        clearImage,
      })

      if (!result.ok) {
        showError(result.error)
        return
      }

      setMessage({
        type: "success",
        text: editingId
          ? t("generateManualUpdated")
          : t("generateManualCreated"),
      })
      setImageFile(null)
      setClearImage(false)
      if (!editingId) {
        setValues(emptyMarketFormValues())
      } else {
        setEditingId(result.id)
      }
      router.refresh()
    })
  }

  function handleDelete(marketId: string) {
    if (!window.confirm(t("generateDeleteConfirm"))) return
    setMessage(null)
    startTransition(async () => {
      const result = await deleteMarketAction(marketId)
      if (!result.ok) {
        showError(result.error)
        return
      }
      if (editingId === marketId) {
        startCreate()
      }
      setMessage({ type: "success", text: t("generateDeleteSuccess") })
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base font-medium">
            {editingId
              ? t("generateManualEditTitle")
              : t("generateManualCreateTitle")}
          </CardTitle>
          {editingId ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={startCreate}
            >
              {t("generateManualNew")}
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            {t("generateManualDescription")}
          </p>
          <MarketFormFields
            values={values}
            disabled={pending}
            labels={fieldLabels}
            categoryLabels={categoryLabels}
            onChange={setValues}
          />

          <div className="space-y-2">
            <Label htmlFor="manual-image">{t("generateImageLabel")}</Label>
            <input
              id="manual-image"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              disabled={pending}
              className="text-sm text-muted-foreground file:mr-3 file:rounded-2xl file:border-0 file:bg-primary-container file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-primary"
              onChange={(e) => {
                setImageFile(e.target.files?.[0] ?? null)
                setClearImage(false)
              }}
            />
            {editingMarket?.imageUrl && !clearImage && !imageFile ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={editingMarket.imageUrl}
                  alt=""
                  className="size-12 rounded-lg object-cover"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => setClearImage(true)}
                >
                  {t("generateImageClear")}
                </Button>
              </div>
            ) : null}
          </div>

          <Button
            type="button"
            disabled={pending}
            onClick={handleSave}
            className="bg-primary-container hover:bg-primary text-white"
          >
            {pending
              ? t("generateSaving")
              : editingId
                ? t("generateManualSaveEdit")
                : t("generateManualSaveCreate")}
          </Button>
        </CardContent>
      </Card>

      {message ? (
        <p
          className={
            message.type === "error"
              ? "text-destructive text-sm"
              : "text-sm text-emerald-700 dark:text-emerald-400"
          }
          role="status"
        >
          {message.text}
        </p>
      ) : null}

      <div className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">
          {t("generateManualListTitle")}
        </h2>
        {markets.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {t("generateManualEmpty")}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("generateColTitle")}</TableHead>
                  <TableHead>{t("generateColCategory")}</TableHead>
                  <TableHead>{t("generateColStatus")}</TableHead>
                  <TableHead>{t("generateColYes")}</TableHead>
                  <TableHead>{t("generateColActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {markets.map((market) => (
                  <TableRow key={market.id}>
                    <TableCell className="max-w-xs">
                      <Link
                        href={`/markets/${market.slug}`}
                        className="font-medium hover:underline"
                      >
                        {market.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {t(`generateCategory.${market.category}`)}
                    </TableCell>
                    <TableCell>
                      {market.status === MarketStatus.open
                        ? t("generateStatusOpen")
                        : t("generateStatusResolved")}
                    </TableCell>
                    <TableCell>
                      {(market.yesPrice * 100).toFixed(0)}¢
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={
                            pending || market.status !== MarketStatus.open
                          }
                          onClick={() => startEdit(market)}
                        >
                          {t("generateEdit")}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={pending}
                          onClick={() => handleDelete(market.id)}
                        >
                          {t("generateDelete")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}

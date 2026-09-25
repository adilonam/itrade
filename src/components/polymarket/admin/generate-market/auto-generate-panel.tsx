"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/polymarket/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/polymarket/ui/card"
import { Checkbox } from "@/components/polymarket/ui/checkbox"
import { Label } from "@/components/polymarket/ui/label"
import { Textarea } from "@/components/polymarket/ui/textarea"
import {
  MarketFormFields,
  datetimeLocalToIso,
  draftToFormValues,
  noPriceFromYes,
  parseTags,
  type MarketFormValues,
} from "@/components/polymarket/admin/generate-market/market-form-fields"
import {
  generateMarketDraftsAction,
  saveMarketDraftsAction,
} from "@/lib/polymarket/admin/generate-market-actions"
import { GENERATE_MARKET_FILE_ACCEPT } from "@/lib/polymarket/admin/generate-market-ai"
import {
  MARKET_CATEGORIES,
  type MarketDraftInput,
} from "@/lib/polymarket/admin/generate-market-schema"

type DraftRow = {
  key: string
  selected: boolean
  values: MarketFormValues
}

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

function firstImageFile(files: File[]): File | null {
  return files.find((f) => f.type.startsWith("image/")) ?? null
}

export function AutoGeneratePanel() {
  const t = useTranslations("Admin")
  const [pending, startTransition] = useTransition()
  const [text, setText] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [drafts, setDrafts] = useState<DraftRow[]>([])
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

  function showError(key: string) {
    setMessage({
      type: "error",
      text: t(`generateErrors.${key}` as "generateErrors.invalid"),
    })
  }

  function handleGenerate() {
    setMessage(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set("text", text)
      for (const file of files) {
        formData.append("files", file)
      }
      const result = await generateMarketDraftsAction(formData)
      if (!result.ok) {
        showError(result.error)
        return
      }
      setDrafts(
        result.drafts.map((draft, index) => ({
          key: `draft-${index}-${Date.now()}`,
          selected: true,
          values: draftToFormValues(draft),
        }))
      )
      setMessage({
        type: "success",
        text: t("generateDraftsReady", { count: result.drafts.length }),
      })
    })
  }

  function updateDraft(key: string, next: Partial<DraftRow>) {
    setDrafts((rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...next } : row))
    )
  }

  function handleSave() {
    setMessage(null)
    startTransition(async () => {
      const payloadDrafts: MarketDraftInput[] = []
      for (const row of drafts) {
        const yes = Number.parseFloat(row.values.yesPrice)
        if (!Number.isFinite(yes)) {
          showError("invalid")
          return
        }
        payloadDrafts.push({
          title: row.values.title,
          description: row.values.description,
          context: row.values.context || undefined,
          category: row.values.category,
          resolutionDate: datetimeLocalToIso(row.values.resolutionDate),
          dateLabel: row.values.dateLabel || undefined,
          tags: parseTags(row.values.tags),
          iconLabel: row.values.iconLabel || undefined,
          yesPrice: yes,
          noPrice: noPriceFromYes(yes),
          selected: row.selected,
        })
      }

      let imageBase64: string | null = null
      let imageMimeType: string | null = null
      const imageFile = firstImageFile(files)
      if (imageFile) {
        try {
          imageBase64 = await fileToBase64(imageFile)
          imageMimeType = imageFile.type
        } catch {
          showError("invalid_image")
          return
        }
      }

      const result = await saveMarketDraftsAction({
        drafts: payloadDrafts,
        imageBase64,
        imageMimeType,
      })

      if (!result.ok) {
        showError(result.error)
        return
      }

      setDrafts([])
      setMessage({
        type: "success",
        text: t("generateSaveSuccess", { count: result.created.length }),
      })
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            {t("generateAutoTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            {t("generateAutoDescription")}
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="ai-prompt">{t("generatePromptLabel")}</Label>
            <Textarea
              id="ai-prompt"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={pending}
              className="min-h-28"
              placeholder={t("generatePromptPlaceholder")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai-files">{t("generateFilesLabel")}</Label>
            <InputFiles
              id="ai-files"
              disabled={pending}
              files={files}
              onChange={setFiles}
              clearLabel={t("generateFilesClear")}
            />
          </div>
          <Button
            type="button"
            disabled={pending || (!text.trim() && files.length === 0)}
            onClick={handleGenerate}
            className="bg-primary-container hover:bg-primary text-white"
          >
            {pending ? t("generateGenerating") : t("generateSubmit")}
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

      {drafts.length > 0 ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-semibold">
              {t("generateDraftsHeading")}
            </h2>
            <Button
              type="button"
              disabled={pending}
              onClick={handleSave}
              className="bg-primary-container hover:bg-primary text-white"
            >
              {pending ? t("generateSaving") : t("generateSaveSelected")}
            </Button>
          </div>
          {drafts.map((row, index) => (
            <Card key={row.key}>
              <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                <CardTitle className="text-base font-medium">
                  {t("generateDraftCard", { index: index + 1 })}
                </CardTitle>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={row.selected}
                    disabled={pending}
                    onCheckedChange={(checked) =>
                      updateDraft(row.key, {
                        selected: checked === true,
                      })
                    }
                  />
                  {t("generateInclude")}
                </label>
              </CardHeader>
              <CardContent>
                <MarketFormFields
                  values={row.values}
                  disabled={pending}
                  labels={fieldLabels}
                  categoryLabels={categoryLabels}
                  onChange={(values) => updateDraft(row.key, { values })}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {drafts.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {t("generateNoDrafts")}
        </p>
      ) : null}
    </div>
  )
}

function InputFiles({
  id,
  disabled,
  files,
  onChange,
  clearLabel,
}: {
  id: string
  disabled?: boolean
  files: File[]
  onChange: (files: File[]) => void
  clearLabel: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <input
          id={id}
          type="file"
          multiple
          accept={GENERATE_MARKET_FILE_ACCEPT}
          disabled={disabled}
          className="text-sm text-muted-foreground file:mr-3 file:rounded-2xl file:border-0 file:bg-primary-container file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-primary"
          onChange={(e) => {
            const list = e.target.files
            onChange(list ? Array.from(list) : [])
          }}
        />
        {files.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => {
              onChange([])
              const input = document.getElementById(id)
              if (input instanceof HTMLInputElement) {
                input.value = ""
              }
            }}
          >
            {clearLabel}
          </Button>
        ) : null}
      </div>
      {files.length > 0 ? (
        <ul className="text-muted-foreground list-inside list-disc text-sm">
          {files.map((file) => (
            <li key={`${file.name}-${file.size}-${file.lastModified}`}>
              {file.name}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

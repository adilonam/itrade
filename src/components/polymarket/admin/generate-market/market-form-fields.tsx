"use client"

import { Input } from "@/components/polymarket/ui/input"
import { Label } from "@/components/polymarket/ui/label"
import { Textarea } from "@/components/polymarket/ui/textarea"
import {
  MARKET_CATEGORIES,
  type MarketDraftInput,
} from "@/lib/polymarket/admin/generate-market-schema"
import { MarketCategory } from "@/lib/polymarket/db-types"

export type MarketFormValues = {
  title: string
  description: string
  context: string
  category: MarketCategory
  resolutionDate: string
  dateLabel: string
  tags: string
  iconLabel: string
  yesPrice: string
}

export function emptyMarketFormValues(): MarketFormValues {
  const inThirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  return {
    title: "",
    description: "",
    context: "",
    category: MarketCategory.world,
    resolutionDate: toDatetimeLocal(inThirtyDays),
    dateLabel: "",
    tags: "",
    iconLabel: "",
    yesPrice: "0.50",
  }
}

export function draftToFormValues(draft: MarketDraftInput): MarketFormValues {
  return {
    title: draft.title,
    description: draft.description,
    context: draft.context ?? "",
    category: draft.category,
    resolutionDate: toDatetimeLocal(new Date(draft.resolutionDate)),
    dateLabel: draft.dateLabel ?? "",
    tags: (draft.tags ?? []).join(", "),
    iconLabel: draft.iconLabel ?? "",
    yesPrice: Number(draft.yesPrice).toFixed(2),
  }
}

export function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function datetimeLocalToIso(value: string): string {
  const ms = Date.parse(value)
  if (!Number.isFinite(ms)) return value
  return new Date(ms).toISOString()
}

export function parseTags(value: string): string[] {
  return value
    .split(/[,#]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12)
}

export function noPriceFromYes(yesPrice: number): number {
  return Number((1 - yesPrice).toFixed(4))
}

type MarketFormFieldsProps = {
  values: MarketFormValues
  onChange: (next: MarketFormValues) => void
  disabled?: boolean
  labels: {
    title: string
    description: string
    context: string
    category: string
    resolutionDate: string
    dateLabel: string
    tags: string
    tagsHint: string
    iconLabel: string
    yesPrice: string
    noPrice: string
  }
  categoryLabels: Record<(typeof MARKET_CATEGORIES)[number], string>
}

export function MarketFormFields({
  values,
  onChange,
  disabled,
  labels,
  categoryLabels,
}: MarketFormFieldsProps) {
  const yes = Number.parseFloat(values.yesPrice)
  const noDisplay = Number.isFinite(yes)
    ? noPriceFromYes(Math.min(0.99, Math.max(0.01, yes))).toFixed(2)
    : "—"

  function patch(partial: Partial<MarketFormValues>) {
    onChange({ ...values, ...partial })
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2 space-y-1.5">
        <Label htmlFor="market-title">{labels.title}</Label>
        <Input
          id="market-title"
          value={values.title}
          disabled={disabled}
          onChange={(e) => patch({ title: e.target.value })}
        />
      </div>

      <div className="sm:col-span-2 space-y-1.5">
        <Label htmlFor="market-description">{labels.description}</Label>
        <Textarea
          id="market-description"
          value={values.description}
          disabled={disabled}
          onChange={(e) => patch({ description: e.target.value })}
          className="min-h-20"
        />
      </div>

      <div className="sm:col-span-2 space-y-1.5">
        <Label htmlFor="market-context">{labels.context}</Label>
        <Textarea
          id="market-context"
          value={values.context}
          disabled={disabled}
          onChange={(e) => patch({ context: e.target.value })}
          className="min-h-16"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="market-category">{labels.category}</Label>
        <select
          id="market-category"
          value={values.category}
          disabled={disabled}
          onChange={(e) =>
            patch({ category: e.target.value as MarketCategory })
          }
          className="flex h-8 w-full rounded-2xl border border-transparent bg-input/50 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-50"
        >
          {MARKET_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {categoryLabels[cat]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="market-resolution">{labels.resolutionDate}</Label>
        <Input
          id="market-resolution"
          type="datetime-local"
          value={values.resolutionDate}
          disabled={disabled}
          onChange={(e) => patch({ resolutionDate: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="market-date-label">{labels.dateLabel}</Label>
        <Input
          id="market-date-label"
          value={values.dateLabel}
          disabled={disabled}
          onChange={(e) => patch({ dateLabel: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="market-icon">{labels.iconLabel}</Label>
        <Input
          id="market-icon"
          value={values.iconLabel}
          maxLength={4}
          disabled={disabled}
          onChange={(e) => patch({ iconLabel: e.target.value })}
        />
      </div>

      <div className="sm:col-span-2 space-y-1.5">
        <Label htmlFor="market-tags">{labels.tags}</Label>
        <Input
          id="market-tags"
          value={values.tags}
          disabled={disabled}
          onChange={(e) => patch({ tags: e.target.value })}
          placeholder={labels.tagsHint}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="market-yes">{labels.yesPrice}</Label>
        <Input
          id="market-yes"
          type="number"
          min={0.01}
          max={0.99}
          step={0.01}
          value={values.yesPrice}
          disabled={disabled}
          onChange={(e) => patch({ yesPrice: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="market-no">{labels.noPrice}</Label>
        <Input
          id="market-no"
          value={noDisplay}
          disabled
          readOnly
        />
      </div>
    </div>
  )
}

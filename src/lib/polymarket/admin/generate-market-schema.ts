import { z } from "zod"

import { MarketCategory } from "@/lib/polymarket/db-types"

/** Hard cap for AI draft / save payloads (API safety). */
export const GENERATE_MARKET_MAX_MARKETS = 50

export const MARKET_CATEGORIES = [
  MarketCategory.politics,
  MarketCategory.crypto,
  MarketCategory.sports,
  MarketCategory.finance,
  MarketCategory.tech,
  MarketCategory.entertainment,
  MarketCategory.world,
  MarketCategory.commodities,
] as const

export const marketCategorySchema = z.enum(MARKET_CATEGORIES)

const priceSchema = z
  .number()
  .finite()
  .min(0.01, "price_min")
  .max(0.99, "price_max")

export const draftOutcomeSchema = z.object({
  type: z.enum(["YES", "NO"]),
  currentPrice: z.number().finite().min(0).max(1),
})

/** Structured draft returned by the model (pre-normalization). */
export const aiDraftMarketSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(4000),
  context: z.string().trim().max(4000).nullable(),
  category: marketCategorySchema,
  resolutionDate: z
    .string()
    .describe(
      "ISO-8601 datetime on or after today when the market can resolve; use the current calendar year for open markets, not stale past years"
    ),
  dateLabel: z
    .string()
    .trim()
    .max(80)
    .nullable()
    .describe("Short label matching resolutionDate year (e.g. Aug 2026)"),
  tags: z.array(z.string().trim().min(1).max(40)).max(12),
  iconLabel: z.string().trim().max(4).nullable(),
  outcomes: z
    .array(draftOutcomeSchema)
    .length(2)
    .describe("Exactly two outcomes: YES and NO with prices summing to ~1"),
})

export const aiGenerateMarketsSchema = z.object({
  markets: z
    .array(aiDraftMarketSchema)
    .min(1)
    .max(GENERATE_MARKET_MAX_MARKETS),
})

export type AiDraftMarket = z.infer<typeof aiDraftMarketSchema>
export type AiGenerateMarkets = z.infer<typeof aiGenerateMarketsSchema>

/** Editable draft used in the UI and save action (normalized prices). */
export const marketDraftSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(4000),
    context: z
      .string()
      .trim()
      .max(4000)
      .optional()
      .transform((value) => (value && value.length > 0 ? value : null)),
    category: marketCategorySchema,
    resolutionDate: z.string().min(1),
    dateLabel: z
      .string()
      .trim()
      .max(80)
      .optional()
      .transform((value) => (value && value.length > 0 ? value : null)),
    tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
    iconLabel: z
      .string()
      .trim()
      .max(4)
      .optional()
      .transform((value) => (value && value.length > 0 ? value : null)),
    yesPrice: priceSchema,
    noPrice: priceSchema.optional(),
    selected: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    const noPrice =
      data.noPrice ?? Number((1 - data.yesPrice).toFixed(4))
    if (noPrice < 0.01 || noPrice > 0.99) {
      ctx.addIssue({
        code: "custom",
        message: "price_range",
        path: ["noPrice"],
      })
      return
    }
    const sum = data.yesPrice + noPrice
    if (Math.abs(sum - 1) > 0.02) {
      ctx.addIssue({
        code: "custom",
        message: "price_sum",
        path: ["yesPrice"],
      })
    }
  })
  .transform((data) => {
    const yesPrice = Number(data.yesPrice.toFixed(4))
    const noPrice = Number(
      (data.noPrice ?? Number((1 - yesPrice).toFixed(4))).toFixed(4)
    )
    return {
      title: data.title,
      description: data.description,
      context: data.context,
      category: data.category,
      resolutionDate: data.resolutionDate,
      dateLabel: data.dateLabel,
      tags: data.tags,
      iconLabel: data.iconLabel,
      yesPrice,
      noPrice,
      selected: data.selected,
    }
  })

export type MarketDraft = z.infer<typeof marketDraftSchema>
export type MarketDraftInput = z.input<typeof marketDraftSchema>

export const saveMarketDraftsSchema = z.object({
  drafts: z.array(marketDraftSchema).min(1).max(GENERATE_MARKET_MAX_MARKETS),
  imageBase64: z.string().max(6_000_000).nullable().optional(),
  imageMimeType: z
    .string()
    .regex(/^image\/(png|jpeg|jpg|webp|gif)$/)
    .nullable()
    .optional(),
})

export const upsertMarketSchema = z
  .object({
    id: z.string().min(1).optional(),
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(4000),
    context: z
      .string()
      .trim()
      .max(4000)
      .optional()
      .transform((value) => (value && value.length > 0 ? value : null)),
    category: marketCategorySchema,
    resolutionDate: z.string().min(1),
    dateLabel: z
      .string()
      .trim()
      .max(80)
      .optional()
      .transform((value) => (value && value.length > 0 ? value : null)),
    tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
    iconLabel: z
      .string()
      .trim()
      .max(4)
      .optional()
      .transform((value) => (value && value.length > 0 ? value : null)),
    yesPrice: priceSchema,
    noPrice: priceSchema.optional(),
    imageBase64: z.string().max(6_000_000).nullable().optional(),
    imageMimeType: z
      .string()
      .regex(/^image\/(png|jpeg|jpg|webp|gif)$/)
      .nullable()
      .optional(),
    clearImage: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const noPrice =
      data.noPrice ?? Number((1 - data.yesPrice).toFixed(4))
    if (noPrice < 0.01 || noPrice > 0.99) {
      ctx.addIssue({
        code: "custom",
        message: "price_range",
        path: ["noPrice"],
      })
      return
    }
    if (Math.abs(data.yesPrice + noPrice - 1) > 0.02) {
      ctx.addIssue({
        code: "custom",
        message: "price_sum",
        path: ["yesPrice"],
      })
    }
  })
  .transform((data) => {
    const yesPrice = Number(data.yesPrice.toFixed(4))
    const noPrice = Number(
      (data.noPrice ?? Number((1 - yesPrice).toFixed(4))).toFixed(4)
    )
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      context: data.context,
      category: data.category,
      resolutionDate: data.resolutionDate,
      dateLabel: data.dateLabel,
      tags: data.tags,
      iconLabel: data.iconLabel,
      yesPrice,
      noPrice,
      imageBase64: data.imageBase64 ?? null,
      imageMimeType: data.imageMimeType ?? null,
      clearImage: data.clearImage ?? false,
    }
  })

export type UpsertMarketInput = z.input<typeof upsertMarketSchema>
export type UpsertMarketData = z.infer<typeof upsertMarketSchema>

/** Bump a past resolution datetime to the next same month/day on or after today (UTC). */
export function ensureResolutionOnOrAfterToday(
  raw: string,
  now: Date = new Date()
): { iso: string; fromYear: number | null; toYear: number | null } {
  const startOfTodayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  )
  const parsed = Date.parse(raw)
  let date = Number.isFinite(parsed)
    ? new Date(parsed)
    : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  if (date.getTime() >= startOfTodayUtc) {
    return { iso: date.toISOString(), fromYear: null, toYear: null }
  }

  const fromYear = date.getUTCFullYear()
  const corrected = new Date(date)
  while (corrected.getTime() < startOfTodayUtc) {
    corrected.setUTCFullYear(corrected.getUTCFullYear() + 1)
  }
  return {
    iso: corrected.toISOString(),
    fromYear,
    toYear: corrected.getUTCFullYear(),
  }
}

function replaceYearInText(
  value: string | null | undefined,
  fromYear: number,
  toYear: number
): string | undefined {
  if (value == null) return undefined
  if (fromYear === toYear) return value
  return value.replaceAll(String(fromYear), String(toYear))
}

export function normalizeAiDraft(draft: AiDraftMarket): MarketDraftInput {
  const yes = draft.outcomes.find((o) => o.type === "YES")
  const no = draft.outcomes.find((o) => o.type === "NO")
  let yesPrice = yes?.currentPrice ?? 0.5
  let noPrice = no?.currentPrice ?? 1 - yesPrice

  if (!Number.isFinite(yesPrice) || yesPrice <= 0 || yesPrice >= 1) {
    yesPrice = 0.5
  }
  if (!Number.isFinite(noPrice) || noPrice <= 0 || noPrice >= 1) {
    noPrice = 1 - yesPrice
  }

  // Prefer YES; set NO so they sum to 1 within display precision.
  yesPrice = Math.min(0.99, Math.max(0.01, Number(yesPrice.toFixed(4))))
  noPrice = Number((1 - yesPrice).toFixed(4))
  noPrice = Math.min(0.99, Math.max(0.01, noPrice))

  const { iso: resolutionDate, fromYear, toYear } =
    ensureResolutionOnOrAfterToday(draft.resolutionDate)

  let title = draft.title
  let description = draft.description
  let context = draft.context ?? undefined
  let dateLabel = draft.dateLabel ?? undefined

  if (fromYear != null && toYear != null && fromYear !== toYear) {
    title = replaceYearInText(title, fromYear, toYear) ?? title
    description =
      replaceYearInText(description, fromYear, toYear) ?? description
    context = replaceYearInText(context, fromYear, toYear)
    dateLabel = replaceYearInText(dateLabel, fromYear, toYear)
  }

  return {
    title,
    description,
    context,
    category: draft.category,
    resolutionDate,
    dateLabel,
    tags: draft.tags ?? [],
    iconLabel: draft.iconLabel ?? undefined,
    yesPrice,
    noPrice,
    selected: true,
  }
}

import { createOpenAI } from "@ai-sdk/openai"
import { generateText, Output, APICallError } from "ai"

import {
  aiGenerateMarketsSchema,
  GENERATE_MARKET_MAX_MARKETS,
  MARKET_CATEGORIES,
  normalizeAiDraft,
  type AiGenerateMarkets,
  type MarketDraftInput,
} from "@/lib/polymarket/admin/generate-market-schema"

/** OpenAI model with vision + structured output support. */
const OPENAI_MODEL = "gpt-4o"

export const GENERATE_MARKET_MAX_FILES = 8
export const GENERATE_MARKET_MAX_FILE_BYTES = 4_500_000
export { GENERATE_MARKET_MAX_MARKETS }

export const GENERATE_MARKET_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const

export const GENERATE_MARKET_PDF_MIME_TYPES = ["application/pdf"] as const

export const GENERATE_MARKET_TEXT_MIME_TYPES = [
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "text/json",
] as const

const TEXT_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".markdown",
  ".csv",
  ".json",
])

const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
])

export const GENERATE_MARKET_FILE_ACCEPT = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  ".pdf",
  ".txt",
  ".md",
  ".csv",
  ".json",
].join(",")

export type GenerateMarketAttachment = {
  name: string
  mimeType: string
  bytes: Uint8Array
}

export type GenerateMarketsAiError =
  | "missing_credentials"
  | "missing_input"
  | "ai_failed"
  | "invalid_output"
  | "rate_limited"
  | "budget_exceeded"

function formatPromptToday(now: Date): {
  isoDate: string
  year: number
  human: string
} {
  const isoDate = now.toISOString().slice(0, 10)
  const year = now.getUTCFullYear()
  const human = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  })
  return { isoDate, year, human }
}

/** System prompt with today's date injected so drafts do not inherit stale screenshot years. */
export function buildGenerateMarketSystemPrompt(now: Date = new Date()): string {
  const { isoDate, year, human } = formatPromptToday(now)
  return `You are an expert prediction-market editor for a Polymarket-style app.
Today is ${human} (UTC date ${isoDate}; current year ${year}).
Given optional text notes and/or attached files (images, PDFs, or text documents), propose clear binary YES/NO markets.

Rules:
- Each market must be a single resolvable question with objective resolution criteria.
- description = short public question/summary; context = rules / resolution source details.
- category must be one of: ${MARKET_CATEGORIES.join(", ")}.
- resolutionDate must be an ISO-8601 datetime on or after today (${isoDate}). Prefer future or current settlement relative to today. Never use past years (e.g. 2023, 2024) for new open markets unless the source clearly describes a historical already-resolved market (rare; skip those and prefer live/upcoming markets instead).
- dateLabel is an optional short human label that MUST use the same year as resolutionDate (e.g. "Aug ${year}", "Dec ${year}").
- Titles, descriptions, and dateLabel must use ${year} (or a future year) for open prediction markets — not stale years copied from training data or misread screenshots.
- tags: 1–5 short topic tags.
- iconLabel: optional 2–3 letter abbreviation.
- outcomes: exactly YES and NO; currentPrice floats in 0–1 that sum to approximately 1 (YES is implied probability).
- Extract EVERY distinct binary prediction market visible in the text and/or screenshots/files — not a sample of 5. Cover all cards, rows, titles, and questions you can identify. Deduplicate only exact duplicates. Return as many markets as needed, up to ${GENERATE_MARKET_MAX_MARKETS}.
- Do not invent markets that are not supported by the input; stay faithful to the user's text and attached files.

Screenshot / image reading (critical):
- Carefully read ALL visible text in every uploaded image: market titles, YES/NO or outcome percentages, dates, tags, volume, and UI chrome.
- When a screenshot shows a grid or list of markets, extract each one as its own draft (title, odds/prices if shown, dates, category/tags).
- Extract event and resolution dates from the text ON the image (OCR). Do not guess a year from memory.
- If a date on the image is ambiguous (e.g. "August 20" or "Aug 22" with no year), assume the current or next occurrence relative to today (${isoDate} / ${year}) — never a past year like 2023.
- Polymarket and similar UIs often show month/day without a year; those markets are almost always in the current calendar year (${year}) or the near future. Self-correct if you catch yourself writing an old year.
- After drafting, re-check every resolutionDate, dateLabel, and year mentioned in titles: all must be ≥ ${year} for new open markets (or a clearly future year).`
}

function buildUserPromptPreamble(now: Date, hasBinaryFiles: boolean): string {
  const { isoDate, year } = formatPromptToday(now)
  const visionHint = hasBinaryFiles
    ? ` Read every attached screenshot/PDF carefully: extract every distinct market card/row (not a short sample); copy titles and percentages from visible text; resolve ambiguous month/day dates to ${year} (or the next future occurrence after ${isoDate}), not older years.`
    : ""
  return `Today is ${isoDate} (year ${year}). Draft as many open prediction markets as the input supports (up to ${GENERATE_MARKET_MAX_MARKETS}), with resolutionDate on or after ${isoDate}; dateLabel and title years must match.${visionHint}`
}

export function hasAiCredentials(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim())
}

function resolveModel() {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    return null
  }
  const openai = createOpenAI({ apiKey })
  return openai(OPENAI_MODEL)
}

function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".")
  return dot >= 0 ? name.slice(dot).toLowerCase() : ""
}

export function isGenerateMarketImageMime(mimeType: string): boolean {
  return (GENERATE_MARKET_IMAGE_MIME_TYPES as readonly string[]).includes(
    mimeType
  )
}

export function isGenerateMarketPdfMime(mimeType: string): boolean {
  return (GENERATE_MARKET_PDF_MIME_TYPES as readonly string[]).includes(
    mimeType
  )
}

export function isGenerateMarketTextMime(
  mimeType: string,
  fileName: string
): boolean {
  if (
    (GENERATE_MARKET_TEXT_MIME_TYPES as readonly string[]).includes(mimeType)
  ) {
    return true
  }
  // Browsers often send empty or application/octet-stream for .md/.txt
  if (!mimeType || mimeType === "application/octet-stream") {
    return TEXT_EXTENSIONS.has(fileExtension(fileName))
  }
  return false
}

export function isGenerateMarketAllowedFile(
  mimeType: string,
  fileName: string
): boolean {
  if (isGenerateMarketImageMime(mimeType)) return true
  if (isGenerateMarketPdfMime(mimeType)) return true
  if (mimeType === "application/pdf" || fileExtension(fileName) === ".pdf") {
    return true
  }
  if (isGenerateMarketTextMime(mimeType, fileName)) return true
  if (IMAGE_EXTENSIONS.has(fileExtension(fileName))) return true
  return false
}

function resolveMediaType(
  mimeType: string,
  fileName: string
): string {
  if (mimeType && mimeType !== "application/octet-stream") {
    return mimeType
  }
  const ext = fileExtension(fileName)
  if (ext === ".pdf") return "application/pdf"
  if (ext === ".png") return "image/png"
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg"
  if (ext === ".webp") return "image/webp"
  if (ext === ".gif") return "image/gif"
  if (ext === ".md" || ext === ".markdown") return "text/markdown"
  if (ext === ".csv") return "text/csv"
  if (ext === ".json") return "application/json"
  if (ext === ".txt") return "text/plain"
  return mimeType || "application/octet-stream"
}

type GenerateArgs = {
  text: string
  files?: GenerateMarketAttachment[]
}

export async function generateMarketDraftsWithAi(
  args: GenerateArgs
): Promise<
  | { ok: true; drafts: MarketDraftInput[] }
  | { ok: false; error: GenerateMarketsAiError; message?: string }
> {
  const model = resolveModel()
  if (!model) {
    return { ok: false, error: "missing_credentials" }
  }

  const text = args.text.trim()
  const files = args.files ?? []
  if (!text && files.length === 0) {
    return { ok: false, error: "missing_input" }
  }

  const textSnippets: string[] = []
  const binaryParts: Array<{
    type: "file"
    mediaType: string
    data: Uint8Array
    filename?: string
  }> = []

  for (const file of files) {
    const mediaType = resolveMediaType(file.mimeType, file.name)
    if (isGenerateMarketTextMime(mediaType, file.name)) {
      const decoded = new TextDecoder("utf-8", { fatal: false }).decode(
        file.bytes
      )
      textSnippets.push(
        `--- Attached file: ${file.name} ---\n${decoded.trim()}`
      )
      continue
    }

    binaryParts.push({
      type: "file",
      mediaType,
      data: file.bytes,
      filename: file.name,
    })
  }

  const now = new Date()
  const defaultUserTask =
    binaryParts.length > 0 || textSnippets.length > 0
      ? `Infer prediction markets from the attached file(s). Extract every distinct YES/NO market you can identify (up to ${GENERATE_MARKET_MAX_MARKETS}), not a small sample.`
      : ""

  const userTextParts = [
    buildUserPromptPreamble(now, binaryParts.length > 0),
    text || defaultUserTask,
    ...textSnippets,
  ].filter(Boolean)

  const content: Array<
    | { type: "text"; text: string }
    | {
        type: "file"
        mediaType: string
        data: Uint8Array
        filename?: string
      }
  > = [{ type: "text", text: userTextParts.join("\n\n") }, ...binaryParts]

  try {
    const { output } = await generateText({
      model,
      temperature: 0.3,
      system: buildGenerateMarketSystemPrompt(now),
      messages: [{ role: "user", content }],
      output: Output.object({
        name: "PredictionMarkets",
        description: "Draft prediction markets with YES/NO outcomes",
        schema: aiGenerateMarketsSchema,
      }),
    })

    const parsed = output as AiGenerateMarkets | null | undefined

    if (!parsed?.markets?.length) {
      return { ok: false, error: "invalid_output" }
    }

    return {
      ok: true,
      drafts: parsed.markets.map(normalizeAiDraft),
    }
  } catch (error) {
    if (APICallError.isInstance(error)) {
      if (error.statusCode === 429) {
        return { ok: false, error: "rate_limited" }
      }
      if (error.statusCode === 402) {
        return { ok: false, error: "budget_exceeded" }
      }
      if (
        error.statusCode === 401 ||
        error.statusCode === 403 ||
        /api key|credential|auth/i.test(error.message)
      ) {
        return { ok: false, error: "missing_credentials" }
      }
    }

    const message =
      error instanceof Error ? error.message : "Unknown AI error"
    console.error("[generate-market-ai]", message)
    return { ok: false, error: "ai_failed", message }
  }
}

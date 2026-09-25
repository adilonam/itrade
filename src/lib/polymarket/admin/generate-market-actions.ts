"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/polymarket/auth-session"
import {
  GENERATE_MARKET_MAX_FILES,
  GENERATE_MARKET_MAX_FILE_BYTES,
  generateMarketDraftsWithAi,
  isGenerateMarketAllowedFile,
  isGenerateMarketImageMime,
  type GenerateMarketAttachment,
} from "@/lib/polymarket/admin/generate-market-ai"
import {
  saveMarketDraftsSchema,
  upsertMarketSchema,
  type MarketDraftInput,
  type UpsertMarketInput,
} from "@/lib/polymarket/admin/generate-market-schema"
import { uniqueMarketSlug } from "@/lib/polymarket/admin/generate-market-slug"
import {
  MarketStatus,
  OutcomeType,
  UserRole,
  prisma,
} from "@/lib/polymarket/db"
import { isPolymarketAdmin } from "@/lib/polymarket/roles"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false as const, error: "unauthenticated" as const }
  }
  if (!isPolymarketAdmin(session.user.role)) {
    return { ok: false as const, error: "forbidden" as const }
  }
  return { ok: true as const, session }
}

async function revalidateMarketPaths(slug?: string) {
  revalidatePath(`/polymarket/admin/generate-market`)
  revalidatePath(`/polymarket/admin/market`)
  revalidatePath(`/polymarket/markets`)
  revalidatePath(`/polymarket`)
  if (slug) {
    revalidatePath(`/polymarket/markets/${slug}`)
  }
}

function toPrismaBytes(data: Buffer | Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(data.byteLength)
  copy.set(data instanceof Buffer ? new Uint8Array(data) : data)
  return copy
}

function decodeImage(
  imageBase64: string | null | undefined,
  imageMimeType: string | null | undefined
): { bytes: Uint8Array<ArrayBuffer>; mimeType: string } | null {
  if (!imageBase64 || !imageMimeType) return null
  try {
    const buffer = Buffer.from(imageBase64, "base64")
    if (buffer.length === 0 || buffer.length > 4_500_000) return null
    return { bytes: toPrismaBytes(buffer), mimeType: imageMimeType }
  } catch {
    return null
  }
}

function parseResolutionDate(value: string): Date | null {
  const ms = Date.parse(value)
  if (!Number.isFinite(ms)) return null
  return new Date(ms)
}

export type GenerateDraftsResult =
  | { ok: true; drafts: MarketDraftInput[] }
  | {
      ok: false
      error:
        | "unauthenticated"
        | "forbidden"
        | "missing_credentials"
        | "missing_input"
        | "ai_failed"
        | "invalid_output"
        | "rate_limited"
        | "budget_exceeded"
        | "invalid_image"
        | "invalid_file"
        | "too_many_files"
      message?: string
    }

function collectFormFiles(formData: FormData): File[] {
  const collected: File[] = []
  for (const key of ["files", "files[]", "image"]) {
    for (const value of formData.getAll(key)) {
      if (value instanceof File && value.size > 0) {
        collected.push(value)
      }
    }
  }
  // Dedupe identical File references if both `files` and legacy `image` were set
  return Array.from(new Set(collected))
}

async function parseGenerateAttachments(
  formData: FormData
): Promise<
  | { ok: true; files: GenerateMarketAttachment[] }
  | {
      ok: false
      error: "invalid_file" | "invalid_image" | "too_many_files"
    }
> {
  const rawFiles = collectFormFiles(formData)
  if (rawFiles.length > GENERATE_MARKET_MAX_FILES) {
    return { ok: false, error: "too_many_files" }
  }

  const files: GenerateMarketAttachment[] = []
  for (const file of rawFiles) {
    if (file.size > GENERATE_MARKET_MAX_FILE_BYTES) {
      return {
        ok: false,
        error: isGenerateMarketImageMime(file.type)
          ? "invalid_image"
          : "invalid_file",
      }
    }
    if (!isGenerateMarketAllowedFile(file.type, file.name)) {
      return {
        ok: false,
        error: file.type.startsWith("image/")
          ? "invalid_image"
          : "invalid_file",
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    files.push({
      name: file.name || "attachment",
      mimeType: file.type || "application/octet-stream",
      bytes: new Uint8Array(buffer),
    })
  }

  return { ok: true, files }
}

export async function generateMarketDraftsAction(
  formData: FormData
): Promise<GenerateDraftsResult> {
  const gate = await requireAdmin()
  if (!gate.ok) return gate

  const text = String(formData.get("text") ?? "")
  const parsed = await parseGenerateAttachments(formData)
  if (!parsed.ok) return parsed

  return generateMarketDraftsWithAi({ text, files: parsed.files })
}

export type SaveDraftsResult =
  | { ok: true; created: { id: string; slug: string }[] }
  | {
      ok: false
      error:
        | "unauthenticated"
        | "forbidden"
        | "invalid"
        | "no_selection"
        | "invalid_date"
    }

export async function saveMarketDraftsAction(
  input: unknown
): Promise<SaveDraftsResult> {
  const gate = await requireAdmin()
  if (!gate.ok) return gate

  const parsed = saveMarketDraftsSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "invalid" }
  }

  const selected = parsed.data.drafts.filter((d) => d.selected)
  if (selected.length === 0) {
    return { ok: false, error: "no_selection" }
  }

  const image = decodeImage(
    parsed.data.imageBase64,
    parsed.data.imageMimeType
  )

  const created: { id: string; slug: string }[] = []

  try {
    for (const draft of selected) {
      const resolutionDate = parseResolutionDate(draft.resolutionDate)
      if (!resolutionDate) {
        return { ok: false, error: "invalid_date" }
      }

      const slug = await uniqueMarketSlug(draft.title)
      const market = await prisma.predictionMarket.create({
        data: {
          slug,
          title: draft.title,
          description: draft.description,
          context: draft.context,
          category: draft.category,
          tags: draft.tags,
          status: MarketStatus.open,
          resolutionDate,
          dateLabel: draft.dateLabel,
          iconLabel: draft.iconLabel,
          image: image?.bytes ?? undefined,
          imageMimeType: image?.mimeType ?? undefined,
          outcomes: {
            create: [
              { type: OutcomeType.YES, currentPrice: draft.yesPrice },
              { type: OutcomeType.NO, currentPrice: draft.noPrice },
            ],
          },
        },
        select: { id: true, slug: true },
      })
      created.push(market)
    }
  } catch (error) {
    console.error("[saveMarketDraftsAction]", error)
    return { ok: false, error: "invalid" }
  }

  await revalidateMarketPaths()
  return { ok: true, created }
}

export type UpsertMarketResult =
  | { ok: true; id: string; slug: string }
  | {
      ok: false
      error:
        | "unauthenticated"
        | "forbidden"
        | "invalid"
        | "not_found"
        | "invalid_date"
        | "closed"
    }

export async function upsertMarketAction(
  input: UpsertMarketInput
): Promise<UpsertMarketResult> {
  const gate = await requireAdmin()
  if (!gate.ok) return gate

  const parsed = upsertMarketSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "invalid" }
  }

  const data = parsed.data
  const resolutionDate = parseResolutionDate(data.resolutionDate)
  if (!resolutionDate) {
    return { ok: false, error: "invalid_date" }
  }

  const image = decodeImage(data.imageBase64, data.imageMimeType)

  try {
    if (data.id) {
      const existing = await prisma.predictionMarket.findUnique({
        where: { id: data.id },
        select: { id: true, slug: true, status: true },
      })
      if (!existing) {
        return { ok: false, error: "not_found" }
      }
      if (existing.status !== MarketStatus.open) {
        return { ok: false, error: "closed" }
      }

      const slug = await uniqueMarketSlug(data.title, data.id)

      const updateData: {
        slug: string
        title: string
        description: string
        context: string | null
        category: typeof data.category
        tags: string[]
        resolutionDate: Date
        dateLabel: string | null
        iconLabel: string | null
        image?: Uint8Array<ArrayBuffer> | null
        imageMimeType?: string | null
      } = {
        slug,
        title: data.title,
        description: data.description,
        context: data.context,
        category: data.category,
        tags: data.tags,
        resolutionDate,
        dateLabel: data.dateLabel,
        iconLabel: data.iconLabel,
      }

      if (data.clearImage) {
        updateData.image = null
        updateData.imageMimeType = null
      } else if (image) {
        updateData.image = image.bytes
        updateData.imageMimeType = image.mimeType
      }

      await prisma.$transaction(async (tx) => {
        await tx.predictionMarket.update({
          where: { id: data.id },
          data: updateData,
        })
        await tx.predictionOutcome.update({
          where: {
            marketId_type: { marketId: data.id!, type: OutcomeType.YES },
          },
          data: { currentPrice: data.yesPrice },
        })
        await tx.predictionOutcome.update({
          where: {
            marketId_type: { marketId: data.id!, type: OutcomeType.NO },
          },
          data: { currentPrice: data.noPrice },
        })
      })

      await revalidateMarketPaths(slug)
      return { ok: true, id: data.id, slug }
    }

    const slug = await uniqueMarketSlug(data.title)
    const market = await prisma.predictionMarket.create({
      data: {
        slug,
        title: data.title,
        description: data.description,
        context: data.context,
        category: data.category,
        tags: data.tags,
        status: MarketStatus.open,
        resolutionDate,
        dateLabel: data.dateLabel,
        iconLabel: data.iconLabel,
        image: image?.bytes ?? undefined,
        imageMimeType: image?.mimeType ?? undefined,
        outcomes: {
          create: [
            { type: OutcomeType.YES, currentPrice: data.yesPrice },
            { type: OutcomeType.NO, currentPrice: data.noPrice },
          ],
        },
      },
      select: { id: true, slug: true },
    })

    await revalidateMarketPaths(slug)
    return { ok: true, id: market.id, slug: market.slug }
  } catch (error) {
    console.error("[upsertMarketAction]", error)
    return { ok: false, error: "invalid" }
  }
}

export type DeleteMarketResult =
  | { ok: true }
  | {
      ok: false
      error: "unauthenticated" | "forbidden" | "invalid" | "not_found"
    }

export async function deleteMarketAction(
  marketId: string
): Promise<DeleteMarketResult> {
  const gate = await requireAdmin()
  if (!gate.ok) return gate

  if (!marketId || typeof marketId !== "string") {
    return { ok: false, error: "invalid" }
  }

  try {
    const existing = await prisma.predictionMarket.findUnique({
      where: { id: marketId },
      select: { id: true, slug: true },
    })
    if (!existing) {
      return { ok: false, error: "not_found" }
    }

    await prisma.predictionMarket.delete({ where: { id: marketId } })
    await revalidateMarketPaths(existing.slug)
    return { ok: true }
  } catch (error) {
    console.error("[deleteMarketAction]", error)
    return { ok: false, error: "invalid" }
  }
}

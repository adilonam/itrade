import { prisma } from "@/lib/polymarket/db"

/** URL-safe slug from a market title (lowercase kebab-case). */
export function slugifyTitle(title: string): string {
  const base = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)

  return base.length > 0 ? base : "market"
}

/** Returns a unique slug, appending -2, -3, … when needed. */
export async function uniqueMarketSlug(
  title: string,
  excludeId?: string
): Promise<string> {
  const base = slugifyTitle(title)
  let candidate = base
  let n = 2

  for (;;) {
    const existing = await prisma.predictionMarket.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
    if (!existing || (excludeId && existing.id === excludeId)) {
      return candidate
    }
    candidate = `${base}-${n}`
    n += 1
    if (n > 1000) {
      candidate = `${base}-${Date.now().toString(36)}`
      return candidate
    }
  }
}

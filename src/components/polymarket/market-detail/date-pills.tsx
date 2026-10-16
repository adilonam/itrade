import { Link } from "@/lib/polymarket/routing"
import { cn } from "@/lib/utils"
import type { SiblingMarket } from "@/lib/polymarket/markets/queries"

export function DatePills({
  siblings,
  activeSlug,
}: {
  siblings: SiblingMarket[]
  activeSlug: string
}) {
  if (siblings.length <= 1) {
    return null
  }

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {siblings.map((sibling) => {
        const active = sibling.slug === activeSlug
        return (
          <Link
            key={sibling.id}
            href={`/markets/${sibling.slug}`}
            className={cn(
              "font-label rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              active
                ? "bg-on-surface text-surface-white"
                : "bg-surface-container text-on-surface hover:bg-surface-container-high"
            )}
          >
            {sibling.dateLabel ??
              new Date(sibling.resolutionDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                timeZone: "UTC",
              })}
          </Link>
        )
      })}
    </div>
  )
}

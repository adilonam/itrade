"use client"

import { useState } from "react"

import { Button } from "@/components/polymarket/ui/button"
import { cn } from "@/lib/utils"

export function RulesPanel({
  description,
  context,
}: {
  description: string
  context: string | null
}) {
  const [tab, setTab] = useState<"rules" | "context">("rules")
  const [expanded, setExpanded] = useState(false)
  const text = tab === "rules" ? description : (context ?? description)
  const long = text.length > 280
  const shown = !expanded && long ? `${text.slice(0, 280).trim()}…` : text

  return (
    <section className="bg-surface-white border-outline-variant mb-8 rounded-xl border p-4">
      <div className="mb-3 flex gap-4 border-b border-outline-variant">
        {(["rules", "context"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "font-label pb-2 text-sm font-semibold",
              tab === key
                ? "text-on-surface border-on-surface border-b-2"
                : "text-secondary"
            )}
          >
            {key === "rules" ? "Rules" : "Market Context"}
          </button>
        ))}
      </div>
      <p className="text-body-sm text-on-surface-variant whitespace-pre-wrap">
        {shown}
      </p>
      {long ? (
        <Button
          variant="link"
          className="mt-1 h-auto px-0"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show less" : "Show more"}
        </Button>
      ) : null}
    </section>
  )
}

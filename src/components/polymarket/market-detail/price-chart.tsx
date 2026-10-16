"use client"

import { useMemo, useState } from "react"

import { formatVolume } from "@/components/polymarket/markets/data"
import { cn } from "@/lib/utils"
import type { PricePoint } from "@/lib/polymarket/markets/queries"

const RANGES = ["1H", "6H", "1D", "1W", "1M", "ALL"] as const
type Range = (typeof RANGES)[number]

const RANGE_MS: Record<Exclude<Range, "ALL">, number> = {
  "1H": 60 * 60 * 1000,
  "6H": 6 * 60 * 60 * 1000,
  "1D": 24 * 60 * 60 * 1000,
  "1W": 7 * 24 * 60 * 60 * 1000,
  "1M": 30 * 24 * 60 * 60 * 1000,
}

function filterPoints(history: PricePoint[], range: Range): PricePoint[] {
  if (range === "ALL" || history.length === 0) {
    return history
  }
  const last = history.at(-1)
  if (!last) {
    return history
  }
  const cutoff = new Date(last.timestamp).getTime() - RANGE_MS[range]
  const filtered = history.filter(
    (point) => new Date(point.timestamp).getTime() >= cutoff
  )
  return filtered.length > 1 ? filtered : history.slice(-2)
}

export function PriceChart({
  history,
  chance,
  changePercent,
  volume,
  resolutionDate,
}: {
  history: PricePoint[]
  chance: number
  changePercent: number
  volume: number
  resolutionDate: string
}) {
  const [range, setRange] = useState<Range>("ALL")
  const points = useMemo(() => filterPoints(history, range), [history, range])
  const up = changePercent >= 0
  const resolution = new Date(resolutionDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })

  const { path, area, ticks, maxY, pad } = useMemo(() => {
    if (points.length === 0) {
      return {
        path: "",
        area: "",
        ticks: [] as { label: string; x: number }[],
        maxY: 25,
        pad: { l: 40, r: 28, t: 12, b: 28 },
      }
    }
    const width = 800
    const height = 260
    const pad = { l: 40, r: 28, t: 12, b: 28 }
    const innerW = width - pad.l - pad.r
    const innerH = height - pad.t - pad.b
    const ys = points.map((p) => p.probability * 100)
    const maxY = Math.max(25, Math.ceil(Math.max(...ys, 0) / 25) * 25)
    const minT = new Date(points[0]!.timestamp).getTime()
    const maxT = new Date(points.at(-1)!.timestamp).getTime()
    const span = Math.max(maxT - minT, 1)
    const coords = points.map((point, index) => {
      const t = new Date(point.timestamp).getTime()
      const x = pad.l + (innerW * (t - minT)) / span
      const y = pad.t + innerH * (1 - (point.probability * 100) / maxY)
      return { x, y, index }
    })
    const d = coords
      .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(" ")
    const first = coords[0]
    const last = coords.at(-1)
    const areaPath =
      first && last
        ? `${d} L ${last.x.toFixed(1)} ${pad.t + innerH} L ${first.x.toFixed(1)} ${pad.t + innerH} Z`
        : ""
    const tickCount = Math.min(6, points.length)
    const xTicks = Array.from({ length: tickCount }, (_, i) => {
      const p = points[Math.round(((points.length - 1) * i) / Math.max(tickCount - 1, 1))]
      const x = coords[Math.round(((coords.length - 1) * i) / Math.max(tickCount - 1, 1))]?.x ?? 0
      return {
        x,
        label: p
          ? new Date(p.timestamp).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : "",
      }
    })
    return { path: d, area: areaPath, ticks: xTicks, maxY, pad, width, height, innerH }
  }, [points])

  return (
    <section className="mb-6">
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <h2 className="font-headline text-4xl font-semibold tracking-tight text-primary md:text-5xl">
          {chance}%{" "}
          <span className="text-body-md font-label font-medium text-primary">
            chance
          </span>
        </h2>
        <span
          className={cn(
            "mb-1 text-sm font-semibold",
            up ? "text-success-green" : "text-danger-red"
          )}
        >
          {up ? "↑" : "↓"} {Math.abs(changePercent).toFixed(1)}%
        </span>
      </div>

      <div className="bg-surface-white border-outline-variant rounded-xl border p-3">
        <svg viewBox="0 0 800 260" className="text-outline h-56 w-full md:h-72">
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const y = pad.t + (260 - pad.t - pad.b) * (1 - frac)
            const label = `${Math.round(frac * maxY)}%`
            return (
              <g key={frac}>
                <line
                  x1={pad.l}
                  x2={800 - pad.r}
                  y1={y}
                  y2={y}
                  className="stroke-outline-variant"
                  strokeWidth="1"
                />
                <text
                  x={0}
                  y={y + 4}
                  className="fill-secondary text-[10px]"
                >
                  {label}
                </text>
              </g>
            )
          })}
          {area ? (
            <path d={area} className="fill-primary/15 dark:fill-primary/25" />
          ) : null}
          {path ? (
            <path
              d={path}
              fill="none"
              className="stroke-primary"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}
          {ticks.map((tick, index) => (
            <text
              key={`${tick.x}-${tick.label}`}
              x={tick.x}
              y="252"
              textAnchor={
                index === 0
                  ? "start"
                  : index === ticks.length - 1
                    ? "end"
                    : "middle"
              }
              className="fill-secondary text-[10px]"
            >
              {tick.label}
            </text>
          ))}
        </svg>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="text-secondary font-data text-xs">
            <span className="text-on-surface font-semibold">
              {formatVolume(volume)}
            </span>{" "}
            Vol.{" "}
            <span className="mx-2">·</span>
            {resolution}
          </div>
          <div className="flex gap-1">
            {RANGES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRange(item)}
                className={cn(
                  "rounded-md px-2 py-1 text-[11px] font-semibold",
                  range === item
                    ? "bg-surface-container-high text-on-surface"
                    : "text-secondary hover:text-on-surface"
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

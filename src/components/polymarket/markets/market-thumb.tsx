"use client"

import Image from "next/image"
import { useState } from "react"

import { cn } from "@/lib/utils"

type MarketThumbProps = {
  src: string | null
  label: string
  className?: string
  size?: number
}

export function MarketThumb({
  src,
  label,
  className,
  size = 40,
}: MarketThumbProps) {
  const [failed, setFailed] = useState(false)

  if (src && !failed) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        unoptimized
        onError={() => setFailed(true)}
        className={cn("shrink-0 rounded-md object-cover", className)}
      />
    )
  }

  return (
    <div
      className={cn(
        "bg-surface-container font-label text-label-caps text-secondary flex shrink-0 items-center justify-center rounded-md",
        className
      )}
      style={{ width: size, height: size }}
    >
      {label}
    </div>
  )
}

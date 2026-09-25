"use client"

import { Bookmark, Link2, Share2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/polymarket/ui/button"

export function ShareActions() {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ url: window.location.href, title: document.title })
        return
      } catch {
        // fall through to copy
      }
    }
    await copyLink()
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon-sm" onClick={share} aria-label="Share">
        <Share2 />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={copyLink}
        aria-label={copied ? "Copied" : "Copy link"}
      >
        <Link2 />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="Bookmark">
        <Bookmark />
      </Button>
    </div>
  )
}

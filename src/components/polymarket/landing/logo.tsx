import Image from "next/image"

import { cn } from "@/lib/utils"

import { Link } from "@/lib/polymarket/routing"

type LogoProps = {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={cn("flex shrink-0 items-center", className)}>
      <Image
        src="/polymarket/image/predictions-logo.png"
        alt="ITRADE"
        width={140}
        height={112}
        className="h-10 w-auto"
        priority
      />
    </Link>
  )
}

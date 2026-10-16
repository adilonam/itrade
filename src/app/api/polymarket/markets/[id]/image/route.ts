import { NextResponse } from "next/server"

import { prisma } from "@/lib/polymarket/db"

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const market = await prisma.predictionMarket.findUnique({
    where: { id },
    select: { image: true, imageMimeType: true },
  })

  if (!market?.image) {
    return new NextResponse(null, { status: 404 })
  }

  return new NextResponse(Buffer.from(market.image), {
    headers: {
      "Content-Type": market.imageMimeType ?? "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  })
}

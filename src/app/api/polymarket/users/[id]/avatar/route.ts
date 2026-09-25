import { NextResponse } from "next/server"

import { prisma } from "@/lib/polymarket/db"

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const user = await prisma.user.findUnique({
    where: { id },
    select: { predictionAvatar: true, predictionAvatarMimeType: true },
  })

  if (!user?.predictionAvatar) {
    return new NextResponse(null, { status: 404 })
  }

  return new NextResponse(Buffer.from(user.predictionAvatar), {
    headers: {
      "Content-Type": user.predictionAvatarMimeType ?? "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  })
}

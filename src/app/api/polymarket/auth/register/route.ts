import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"

import { getVerifiedSignup } from "@/lib/polymarket/auth/email-otp"
import { Prisma } from "@/lib/prisma/generated/client"
import { prisma } from "@/lib/polymarket/db"

const registerSchema = z.object({
  name: z.string().trim().max(100).optional(),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  signupToken: z.string().min(32).max(128),
})

export async function POST(request: Request) {
  try {
    const body = registerSchema.parse(await request.json())
    const email = body.email.toLowerCase()

    const verified = await getVerifiedSignup({
      email,
      signupToken: body.signupToken,
    })

    if (!verified.ok) {
      return NextResponse.json(
        { error: verified.error, code: verified.code },
        { status: verified.status }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingUser) {
      return NextResponse.json(
        {
          error: "An account with this email already exists.",
          code: "EMAIL_EXISTS",
        },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(body.password, 12)

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: verified.name,
          email,
          password: hashedPassword,
          emailVerified: new Date(),
          predictionBalance: 10_000,
        },
      })

      await tx.userBalance.createMany({
        data: [
          { userId: user.id, type: "REAL", amount: 0 },
          { userId: user.id, type: "DEMO", amount: 10000 },
        ],
        skipDuplicates: true,
      })

      await tx.predictionBalanceLedger.create({
        data: {
          userId: user.id,
          amount: 10_000,
          balanceAfter: 10_000,
          type: "seed",
          note: "Welcome prediction balance",
        },
      })

      await tx.emailOtp.delete({
        where: { id: verified.id },
      })
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid registration details.", code: "VALIDATION_ERROR" },
        { status: 400 }
      )
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error: "An account with this email already exists.",
          code: "EMAIL_EXISTS",
        },
        { status: 409 }
      )
    }

    console.error("Registration failed:", error)
    return NextResponse.json(
      { error: "Unable to create account.", code: "REGISTER_FAILED" },
      { status: 500 }
    )
  }
}

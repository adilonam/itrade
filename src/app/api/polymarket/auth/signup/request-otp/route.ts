import { NextResponse } from "next/server"
import { z } from "zod"

import { requestSignupOtp } from "@/lib/polymarket/auth/email-otp"

const requestOtpSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().email(),
  locale: z.string().trim().min(2).max(10).optional(),
})

export async function POST(request: Request) {
  try {
    const body = requestOtpSchema.parse(await request.json())
    const result = await requestSignupOtp({
      name: body.name,
      email: body.email.toLowerCase(),
      locale: body.locale,
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          code: result.code,
          retryAfterSeconds: result.retryAfterSeconds,
        },
        { status: result.status }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid name or email.", code: "VALIDATION_ERROR" },
        { status: 400 }
      )
    }

    console.error("Failed to request signup OTP")
    return NextResponse.json(
      { error: "Unable to send verification email.", code: "REQUEST_FAILED" },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import { z } from "zod"

import { verifySignupOtp } from "@/lib/polymarket/auth/email-otp"

const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
})

export async function POST(request: Request) {
  try {
    const body = verifyOtpSchema.parse(await request.json())
    const result = await verifySignupOtp({
      email: body.email.toLowerCase(),
      code: body.code,
    })

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.status }
      )
    }

    return NextResponse.json({ success: true, signupToken: result.signupToken })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid verification details.", code: "VALIDATION_ERROR" },
        { status: 400 }
      )
    }

    console.error("Failed to verify signup OTP")
    return NextResponse.json(
      { error: "Unable to verify code.", code: "VERIFY_FAILED" },
      { status: 500 }
    )
  }
}

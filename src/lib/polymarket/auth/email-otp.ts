import { prisma } from "@/lib/polymarket/db"

import { generateOtp, generateToken, hashesEqual, hashValue } from "./crypto"
import { getSmtpConfig, sendConfirmEmail } from "@/lib/polymarket/mail/smtp"

const OTP_TTL_MS = 10 * 60 * 1000
const SIGNUP_TOKEN_TTL_MS = 15 * 60 * 1000
const RESEND_COOLDOWN_MS = 60 * 1000
const MAX_ATTEMPTS = 5

export type SignupErrorCode =
  | "EMAIL_EXISTS"
  | "RATE_LIMITED"
  | "SMTP_NOT_CONFIGURED"
  | "SMTP_SEND_FAILED"
  | "INVALID_CODE"
  | "CODE_EXPIRED"
  | "TOO_MANY_ATTEMPTS"
  | "SIGNUP_TOKEN_INVALID"
  | "SIGNUP_TOKEN_EXPIRED"

export type SignupError = {
  ok: false
  status: number
  code: SignupErrorCode
  error: string
  retryAfterSeconds?: number
}

function fail(
  status: number,
  code: SignupErrorCode,
  error: string,
  retryAfterSeconds?: number
): SignupError {
  return { ok: false, status, code, error, retryAfterSeconds }
}

export async function requestSignupOtp(input: {
  name: string
  email: string
  locale?: string
}): Promise<{ ok: true } | SignupError> {
  const smtp = getSmtpConfig()
  if (!smtp) {
    return fail(
      503,
      "SMTP_NOT_CONFIGURED",
      "Email delivery is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM_EMAIL."
    )
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  })

  if (existingUser) {
    return fail(409, "EMAIL_EXISTS", "An account with this email already exists.")
  }

  const existing = await prisma.emailOtp.findUnique({
    where: { email: input.email },
  })

  if (existing) {
    const elapsed = Date.now() - existing.lastSentAt.getTime()
    if (elapsed < RESEND_COOLDOWN_MS) {
      return fail(
        429,
        "RATE_LIMITED",
        "Please wait before requesting another code.",
        Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000)
      )
    }
  }

  const code = generateOtp()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS)
  const codeHash = hashValue(`otp:${input.email}:${code}`)

  await prisma.emailOtp.upsert({
    where: { email: input.email },
    create: {
      email: input.email,
      name: input.name,
      codeHash,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
    },
    update: {
      name: input.name,
      codeHash,
      expiresAt,
      attempts: 0,
      verifiedAt: null,
      signupTokenHash: null,
      signupTokenExpiresAt: null,
      lastSentAt: now,
    },
  })

  try {
    await sendConfirmEmail({
      to: input.email,
      name: input.name,
      code,
      locale: input.locale,
      smtp,
    })
  } catch (error) {
    console.error("Failed to send confirmation email", error)
    return fail(
      503,
      "SMTP_SEND_FAILED",
      "Unable to send verification email. Check SMTP settings and try again."
    )
  }

  return { ok: true }
}

export async function verifySignupOtp(input: {
  email: string
  code: string
}): Promise<{ ok: true; signupToken: string } | SignupError> {
  const record = await prisma.emailOtp.findUnique({
    where: { email: input.email },
  })

  if (!record) {
    return fail(400, "INVALID_CODE", "Invalid or expired code.")
  }

  if (record.verifiedAt) {
    return fail(
      400,
      "INVALID_CODE",
      "This code has already been used. Request a new one."
    )
  }

  if (record.expiresAt.getTime() <= Date.now()) {
    return fail(400, "CODE_EXPIRED", "This code has expired. Request a new one.")
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    return fail(
      429,
      "TOO_MANY_ATTEMPTS",
      "Too many attempts. Request a new code."
    )
  }

  const nextAttempts = record.attempts + 1
  const expectedHash = hashValue(`otp:${input.email}:${input.code}`)
  const isValid = hashesEqual(record.codeHash, expectedHash)

  if (!isValid) {
    await prisma.emailOtp.update({
      where: { id: record.id },
      data: { attempts: nextAttempts },
    })

    if (nextAttempts >= MAX_ATTEMPTS) {
      return fail(
        429,
        "TOO_MANY_ATTEMPTS",
        "Too many attempts. Request a new code."
      )
    }

    return fail(400, "INVALID_CODE", "Invalid or expired code.")
  }

  const signupToken = generateToken()
  const signupTokenExpiresAt = new Date(Date.now() + SIGNUP_TOKEN_TTL_MS)

  await prisma.emailOtp.update({
    where: { id: record.id },
    data: {
      verifiedAt: new Date(),
      signupTokenHash: hashValue(`signup:${input.email}:${signupToken}`),
      signupTokenExpiresAt,
      attempts: nextAttempts,
    },
  })

  return { ok: true, signupToken }
}

export async function getVerifiedSignup(input: {
  email: string
  signupToken: string
}): Promise<
  | { ok: true; id: string; email: string; name: string }
  | SignupError
> {
  const record = await prisma.emailOtp.findUnique({
    where: { email: input.email },
  })

  if (!record?.verifiedAt || !record.signupTokenHash || !record.signupTokenExpiresAt) {
    return fail(
      403,
      "SIGNUP_TOKEN_INVALID",
      "Email verification is required before creating an account."
    )
  }

  if (record.signupTokenExpiresAt.getTime() <= Date.now()) {
    return fail(
      403,
      "SIGNUP_TOKEN_EXPIRED",
      "Verification expired. Request a new code."
    )
  }

  const expectedHash = hashValue(`signup:${input.email}:${input.signupToken}`)
  if (!hashesEqual(record.signupTokenHash, expectedHash)) {
    return fail(
      403,
      "SIGNUP_TOKEN_INVALID",
      "Email verification is required before creating an account."
    )
  }

  return {
    ok: true,
    id: record.id,
    email: record.email,
    name: record.name,
  }
}

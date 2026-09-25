import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto"

function getPepper() {
  const secret =
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim()
  if (!secret) {
    throw new Error("AUTH_SECRET or NEXTAUTH_SECRET is not set")
  }
  return secret
}

export function hashValue(value: string): string {
  return createHmac("sha256", getPepper()).update(value).digest("hex")
}

export function hashesEqual(left: string, right: string): boolean {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  if (a.length !== b.length) {
    return false
  }
  return timingSafeEqual(a, b)
}

export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0")
}

export function generateToken(): string {
  return randomBytes(32).toString("hex")
}

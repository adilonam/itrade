"use client"

import { ArrowRight, KeyRound, Lock, Mail, User } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { signIn } from "next-auth/react"
import { useEffect, useState } from "react"

import { Button } from "@/components/polymarket/ui/button"

import { Link, useRouter } from "@/lib/polymarket/routing"

import { AuthCard } from "./auth-card"
import { AuthDivider } from "./auth-divider"
import { AuthGoogleButton } from "./auth-google-button"
import { AuthInputField } from "./auth-input-field"
import { SignUpStepper } from "./sign-up-stepper"

type SignUpStep = 1 | 2 | 3

type ApiError = {
  error?: string
  code?: string
  retryAfterSeconds?: number
  signupToken?: string
}

export function SignUpForm() {
  const t = useTranslations("Auth.signUp")
  const locale = useLocale()
  const router = useRouter()

  const [step, setStep] = useState<SignUpStep>(1)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [signupToken, setSignupToken] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) {
      return
    }

    const timer = window.setInterval(() => {
      setCooldown((seconds) => Math.max(0, seconds - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [cooldown])

  function mapError(data: ApiError) {
    switch (data.code) {
      case "EMAIL_EXISTS":
        return t("emailExists")
      case "SMTP_NOT_CONFIGURED":
        return t("emailNotConfigured")
      case "SMTP_SEND_FAILED":
        return t("sendFailed")
      case "RATE_LIMITED":
        return t("rateLimited")
      case "INVALID_CODE":
      case "CODE_EXPIRED":
        return t("invalidCode")
      case "TOO_MANY_ATTEMPTS":
        return t("tooManyAttempts")
      case "SIGNUP_TOKEN_INVALID":
      case "SIGNUP_TOKEN_EXPIRED":
        return t("verificationExpired")
      default:
        return data.error ?? t("submitError")
    }
  }

  async function requestOtp() {
    const response = await fetch("/api/polymarket/auth/signup/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fullName.trim(),
        email,
        locale,
      }),
    })

    const data = (await response.json()) as ApiError

    if (!response.ok) {
      if (typeof data.retryAfterSeconds === "number") {
        setCooldown(data.retryAfterSeconds)
      }
      setError(mapError(data))
      return false
    }

    setCooldown(60)
    setSignupToken(null)
    setOtp("")
    return true
  }

  async function handleRequestOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const sent = await requestOtp()
      if (sent) {
        setStep(2)
      }
    } catch {
      setError(t("submitError"))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResend() {
    if (cooldown > 0 || isLoading) {
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      await requestOtp()
    } catch {
      setError(t("sendFailed"))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleVerifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!/^\d{6}$/.test(otp)) {
      setError(t("otpInvalid"))
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/polymarket/auth/signup/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      })

      const data = (await response.json()) as ApiError

      if (!response.ok || !data.signupToken) {
        setError(mapError(data))
        return
      }

      setSignupToken(data.signupToken)
      setStep(3)
    } catch {
      setError(t("submitError"))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreateAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"))
      return
    }

    if (!signupToken) {
      setError(t("verificationExpired"))
      setStep(2)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/polymarket/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName.trim(),
          email,
          password,
          signupToken,
        }),
      })

      const data = (await response.json()) as ApiError

      if (!response.ok) {
        setError(mapError(data))
        setIsLoading(false)
        return
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (signInResult?.error) {
        router.push("/sign-in")
        return
      }

      router.push("/")
      router.refresh()
    } catch {
      setError(t("submitError"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthCard mode="sign-up">
      <div className="mb-4 space-y-1">
        <h2 className="font-headline text-headline-lg text-on-surface dark:text-inverse-on-surface">
          {t("title")}
        </h2>
        <p className="text-secondary dark:text-secondary-fixed-dim text-sm">
          {t("subtitle")}
        </p>
      </div>

      <SignUpStepper
        currentStep={step}
        labels={{
          account: t("steps.account"),
          verify: t("steps.verify"),
          confirm: t("steps.confirm"),
        }}
      />

      <AuthGoogleButton />
      <AuthDivider label={t("or")} />

      {error ? (
        <p className="text-destructive mb-4 text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {step === 1 ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <AuthInputField
            id="fullName"
            name="fullName"
            type="text"
            label={t("fullName")}
            placeholder={t("fullName")}
            icon={User}
            value={fullName}
            onChange={setFullName}
            required
            autoComplete="name"
            maxLength={100}
          />

          <AuthInputField
            id="email"
            name="email"
            type="email"
            label={t("email")}
            placeholder="you@example.com"
            icon={Mail}
            value={email}
            onChange={setEmail}
            required
            autoComplete="email"
          />

          <Button
            type="submit"
            className="bg-primary-container hover:bg-primary mt-2 h-11 w-full gap-2 rounded-xl text-sm font-semibold text-white"
            disabled={isLoading}
          >
            {isLoading ? t("sendingCode") : t("continue")}
            {isLoading ? null : <ArrowRight className="size-4" />}
          </Button>
        </form>
      ) : null}

      {step === 2 ? (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <p className="text-on-surface-variant dark:text-secondary-fixed-dim text-sm">
            {t("checkEmail", { email })}
          </p>

          <AuthInputField
            id="otp"
            name="otp"
            type="text"
            label={t("otp")}
            placeholder={t("otp")}
            icon={KeyRound}
            value={otp}
            onChange={(value) => setOtp(value.replace(/\D/g, "").slice(0, 6))}
            required
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            pattern="\d{6}"
            hint={t("otpHint")}
            inputClassName="tracking-[0.35em]"
          />

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || isLoading}
              className="text-primary-container dark:text-primary-fixed-dim text-sm font-medium hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
            >
              {cooldown > 0 ? t("resendIn", { seconds: cooldown }) : t("resend")}
            </button>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="border-outline-variant dark:border-on-secondary-container h-11 flex-1 rounded-xl"
              onClick={() => {
                setError(null)
                setStep(1)
              }}
              disabled={isLoading}
            >
              {t("back")}
            </Button>
            <Button
              type="submit"
              className="bg-primary-container hover:bg-primary h-11 flex-1 rounded-xl text-sm font-semibold text-white"
              disabled={isLoading}
            >
              {isLoading ? t("verifying") : t("verify")}
            </Button>
          </div>
        </form>
      ) : null}

      {step === 3 ? (
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <AuthInputField
            id="password"
            name="password"
            type="password"
            label={t("password")}
            placeholder={t("password")}
            icon={Lock}
            value={password}
            onChange={setPassword}
            required
            autoComplete="new-password"
            minLength={8}
          />

          <AuthInputField
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label={t("confirmPassword")}
            placeholder={t("confirmPassword")}
            icon={Lock}
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
            autoComplete="new-password"
            minLength={8}
          />

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="border-outline-variant dark:border-on-secondary-container h-11 flex-1 rounded-xl"
              onClick={() => {
                setError(null)
                setStep(2)
              }}
              disabled={isLoading}
            >
              {t("back")}
            </Button>
            <Button
              type="submit"
              className="bg-primary-container hover:bg-primary h-11 flex-1 rounded-xl text-sm font-semibold text-white"
              disabled={isLoading}
            >
              {isLoading ? t("submitting") : t("submit")}
            </Button>
          </div>
        </form>
      ) : null}

      <p className="text-on-surface-variant dark:text-secondary-fixed-dim mt-6 text-center text-sm">
        {t("hasAccount")}{" "}
        <Link
          href="/sign-in"
          className="text-primary-container dark:text-primary-fixed-dim font-medium hover:underline"
        >
          {t("signIn")}
        </Link>
      </p>
    </AuthCard>
  )
}

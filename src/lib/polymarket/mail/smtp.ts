import nodemailer from "nodemailer"

import {
  buildConfirmEmailHtml,
  buildConfirmEmailText,
  getAppName,
} from "./confirm-email-template"

export type SmtpConfig = {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
}

export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim()
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASSWORD
  const from = process.env.SMTP_FROM_EMAIL?.trim()
  const portValue = Number(process.env.SMTP_PORT || "587")
  const secure = process.env.SMTP_SECURE === "true"

  if (!host || !user || !pass || !from) {
    return null
  }

  return {
    host,
    port: Number.isFinite(portValue) ? portValue : 587,
    secure,
    user,
    pass,
    from,
  }
}

export async function sendConfirmEmail(options: {
  to: string
  name: string
  code: string
  locale?: string
  smtp: SmtpConfig
}) {
  const appName = getAppName()
  const transporter = nodemailer.createTransport({
    host: options.smtp.host,
    port: options.smtp.port,
    secure: options.smtp.secure,
    auth: {
      user: options.smtp.user,
      pass: options.smtp.pass,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  })

  await transporter.sendMail({
    from: options.smtp.from,
    to: options.to,
    subject: `Confirm your email — ${appName}`,
    text: buildConfirmEmailText({
      appName,
      email: options.to,
      code: options.code,
    }),
    html: buildConfirmEmailHtml({
      appName,
      email: options.to,
      code: options.code,
    }),
  })
}

/** @deprecated Use sendConfirmEmail */
export const sendOtpEmail = sendConfirmEmail

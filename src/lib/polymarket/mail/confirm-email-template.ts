function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export function getAppName() {
  return (
    process.env.APP_NAME?.trim() ||
    process.env.NEXT_PUBLIC_APP_NAME?.trim() ||
    'ITRADE Predict'
  )
}

export function buildConfirmEmailHtml(input: {
  appName: string
  email: string
  code: string
}) {
  const appName = escapeHtml(input.appName)
  const email = escapeHtml(input.email)
  const code = escapeHtml(input.code)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm your email</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;color:#111111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;">
    <tr>
      <td align="left" style="padding:48px 24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;">
          <tr>
            <td style="font-size:28px;line-height:1.25;font-weight:700;color:#111111;padding-bottom:20px;">
              Confirm your email
            </td>
          </tr>
          <tr>
            <td style="font-size:16px;line-height:1.5;color:#111111;padding-bottom:16px;">
              Thanks for signing up for <span style="text-decoration:underline;">${appName}</span> app!
            </td>
          </tr>
          <tr>
            <td style="font-size:16px;line-height:1.5;color:#111111;padding-bottom:28px;">
              Please confirm your email address (<span style="text-decoration:underline;">${email}</span>) by entering this code in the app:
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:48px;">
              <div style="display:inline-block;background:#111111;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:0.35em;line-height:1;padding:16px 24px;border-radius:8px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">
                ${code}
              </div>
            </td>
          </tr>
          <tr>
            <td style="font-size:13px;line-height:1.5;color:#9ca3af;">
              This code expires in 10 minutes. If you didn't create an account, you can safely ignore this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function buildConfirmEmailText(input: {
  appName: string
  email: string
  code: string
}) {
  return [
    "Confirm your email",
    "",
    `Thanks for signing up for ${input.appName} app!`,
    "",
    `Please confirm your email address (${input.email}) by entering this code in the app:`,
    "",
    input.code,
    "",
    "This code expires in 10 minutes. If you didn't create an account, you can safely ignore this email.",
  ].join("\n")
}

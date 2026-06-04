const DEFAULT_SUPPORT_EMAIL = 'support@localhost';

/** Customer-facing contact email from SMTP_FROM_EMAIL env. */
export async function getSupportEmail(): Promise<string> {
  const fromEnv = process.env.SMTP_FROM_EMAIL?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  return DEFAULT_SUPPORT_EMAIL;
}

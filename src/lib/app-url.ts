import { getAppSettingsRow } from '@/lib/app-settings';

const DEFAULT_SUPPORT_EMAIL = 'support@localhost';

/** Customer-facing contact email from SMTP_FROM_EMAIL (env) or app settings. */
export async function getSupportEmail(): Promise<string> {
  const fromEnv = process.env.SMTP_FROM_EMAIL?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  const settings = await getAppSettingsRow();
  const fromSettings = settings?.smtpFromEmail?.trim();
  if (fromSettings) {
    return fromSettings;
  }

  return DEFAULT_SUPPORT_EMAIL;
}

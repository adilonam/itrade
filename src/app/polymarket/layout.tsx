import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { getLocale, getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';

import { AuthProvider } from '@/components/polymarket/auth/auth-provider';
import { RefreshOnBalanceChange } from '@/components/polymarket/auth/refresh-on-balance-change';
import { cn } from '@/lib/utils';
import { isRtlLocale } from '@/lib/polymarket/paths';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk'
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono'
});

export default async function PolymarketLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const baseMessages = await getMessages();
  let polyMessages: Record<string, unknown> = {};
  try {
    polyMessages = (
      await import(`../../../messages/polymarket/${locale}.json`)
    ).default;
  } catch {
    polyMessages = (await import(`../../../messages/polymarket/en.json`))
      .default;
  }

  const messages = { ...baseMessages, ...polyMessages };

  return (
    <div
      className={cn(
        /* h-dvh + overflow-y-auto: root body uses overflow-hidden */
        'polymarket-root bg-surface text-on-surface h-dvh min-h-dvh overflow-x-hidden overflow-y-auto antialiased',
        spaceGrotesk.variable,
        jetbrainsMono.variable
      )}
      dir={isRtlLocale(locale) ? 'rtl' : 'ltr'}
      lang={locale}
    >
      <NextIntlClientProvider locale={locale} messages={messages}>
        <AuthProvider>
          <RefreshOnBalanceChange />
          {children}
        </AuthProvider>
      </NextIntlClientProvider>
    </div>
  );
}

import type { ReactNode } from 'react';
import { getLocale } from 'next-intl/server';
import { landingPageLinks } from '@/constants/data';
import { smxLandingRootFontClasses } from '@/lib/smx-landing-fonts';
import { SmxHeader } from '@/components/landing/smx/smx-header';
import { SmxFooter } from '@/components/landing/smx/smx-footer';
import { cn } from '@/lib/utils';

type SmxMarketingShellProps = {
  appName: string;
  session: boolean;
  children: ReactNode;
  /** Optional root element id (homepage uses `top` for in-page anchors). */
  id?: string;
  className?: string;
};

/**
 * Shared chrome for public/marketing pages — same sticky SMX header + footer
 * as the home landing page. Do not use inside authenticated app shells.
 */
export async function SmxMarketingShell({
  appName,
  session,
  children,
  id,
  className
}: SmxMarketingShellProps) {
  const locale = await getLocale();
  const registerHref = session ? landingPageLinks.trade : landingPageLinks.signUp;

  return (
    <main
      id={id}
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className={cn(
        smxLandingRootFontClasses,
        'smx-landing h-dvh overflow-x-hidden overflow-y-auto scroll-smooth bg-[#080B11] text-gray-100 antialiased',
        className
      )}
      data-app-name={appName}
      data-purpose="smx-marketing-shell"
    >
      <SmxHeader session={session} registerHref={registerHref} />
      {children}
      <SmxFooter />
    </main>
  );
}

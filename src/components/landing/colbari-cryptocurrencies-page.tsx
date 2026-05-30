import Image from 'next/image';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { EB_Garamond, Inter } from 'next/font/google';
import { landingPageLinks } from '@/constants/data';
import {
  LandingHeaderNavMenus,
  LandingHeaderUtilities
} from '@/components/landing/landing-header-nav';
import { LandingSiteFooter } from '@/components/landing/landing-site-footer';

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-colbari-display'
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-colbari-body'
});

type ColbariCryptocurrenciesPageProps = {
  appName: string;
  session: boolean;
};

export async function ColbariCryptocurrenciesPage({
  appName,
  session
}: ColbariCryptocurrenciesPageProps) {
  const locale = await getLocale();
  const t = await getTranslations('Landing.cryptoPage');
  const tradeHref = session ? landingPageLinks.trade : landingPageLinks.signIn;
  const cryptoHighlights = [
    {
      title: t('highlights.wideCoverage.title'),
      description: t('highlights.wideCoverage.description')
    },
    {
      title: t('highlights.alwaysOpen.title'),
      description: t('highlights.alwaysOpen.description')
    },
    {
      title: t('highlights.execution.title'),
      description: t('highlights.execution.description')
    },
    {
      title: t('highlights.versatile.title'),
      description: t('highlights.versatile.description')
    }
  ] as const;

  return (
    <main
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className={`${ebGaramond.variable} ${inter.className} h-dvh overflow-y-auto bg-white text-[#1a1c1c] antialiased`}
    >
      <header className="fixed top-0 left-0 z-50 flex h-20 w-full items-center border-b border-white/10 bg-[#141414] px-5 md:px-16">
        <div className="mx-auto flex h-full w-full max-w-[1440px] items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-6 md:gap-8 lg:gap-12">
            <Link href="/" className="inline-flex shrink-0 items-center" aria-label={appName}>
              <Image
                src="/images/logo-light.png"
                alt={`${appName} logo`}
                width={160}
                height={40}
                className="h-12 w-auto"
                priority
              />
            </Link>
            <LandingHeaderNavMenus />
          </div>
          <LandingHeaderUtilities
            session={session}
            signInHref={landingPageLinks.signIn}
            signUpHref={landingPageLinks.signUp}
            tradeHref={tradeHref}
          />
        </div>
      </header>

      <section className="pt-28 pb-20 md:pt-36 md:pb-24">
        <div className="mx-auto w-full max-w-[1060px] px-5 md:px-16">
          <div className="mb-7 flex items-center gap-2 text-sm text-[#6b6e70]">
            <span>{t('breadcrumb.markets')}</span>
            <span>/</span>
            <span className="text-[#1a1c1c]">{t('breadcrumb.current')}</span>
          </div>

          <h1 className={`${ebGaramond.className} mb-8 text-[44px] leading-[1.1] text-black md:text-[64px]`}>
            {t('title')}
          </h1>

          <div className="max-w-[860px] space-y-6 text-[17px] leading-8 text-[#2f3335]">
            <p className="text-[22px] leading-8 text-black">
              <strong>{t('introHeading')}</strong>
            </p>
            <p>{t('paragraph1')}</p>
            <p>{t('paragraph2')}</p>

            <div className="space-y-5 pt-2">
              {cryptoHighlights.map((item) => (
                <div key={item.title}>
                  <p className="mb-1 text-base font-semibold text-black">• {item.title}</p>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>

            <p className="pt-4 text-[20px] italic">{t('tagline')}</p>
          </div>
        </div>
      </section>

      <LandingSiteFooter appName={appName} />
    </main>
  );
}

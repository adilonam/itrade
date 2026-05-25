import Image from 'next/image';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { EB_Garamond, Inter } from 'next/font/google';
import { IconChartLine, IconSchool } from '@tabler/icons-react';
import { colbariSiteLinks, landingPageLinks } from '@/constants/data';
import {
  LandingHeaderNavMenus,
  LandingHeaderUtilities
} from '@/components/landing/landing-header-nav';

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

const marketCardKeys = [
  'currencies',
  'stocks',
  'commodities',
  'crypto',
  'indices'
] as const;

const marketCardLayout = [
  {
    key: 'currencies' as const,
    image: '/images/landing/colbari/currencies.jpg',
    className: 'md:col-span-7',
    aspect: 'relative aspect-[16/9]'
  },
  {
    key: 'stocks' as const,
    image: '/images/landing/colbari/stocks.jpg',
    className: 'md:col-span-5',
    aspect: 'relative min-h-[300px] md:min-h-[360px]'
  },
  {
    key: 'commodities' as const,
    image: '/images/landing/colbari/commodities.jpg',
    className: 'md:col-span-4',
    aspect: 'relative aspect-square'
  },
  {
    key: 'crypto' as const,
    image: '/images/landing/colbari/crypto.jpg',
    className: 'md:col-span-4',
    aspect: 'relative aspect-square'
  },
  {
    key: 'indices' as const,
    image: '/images/landing/colbari/indices.jpg',
    className: 'md:col-span-4',
    aspect: 'relative aspect-square'
  }
] as const;

const marketCardLinks: Record<(typeof marketCardKeys)[number], string> = {
  currencies: colbariSiteLinks.marketsCurrencies,
  stocks: colbariSiteLinks.marketsStocks,
  commodities: colbariSiteLinks.marketsCommodities,
  crypto: colbariSiteLinks.marketsCryptocurrencies,
  indices: colbariSiteLinks.marketsIndices
};

type ColbariHomepageProps = {
  appName: string;
  session: boolean;
  supportEmail: string;
};

export async function ColbariHomepage({ appName, session, supportEmail }: ColbariHomepageProps) {
  const locale = await getLocale();
  const t = await getTranslations('Landing');
  const createAccountHref = session ? landingPageLinks.trade : landingPageLinks.signUp;
  const tradeHref = session ? landingPageLinks.trade : landingPageLinks.signIn;
  const joinHref = session ? landingPageLinks.trade : landingPageLinks.signUp;

  return (
    <main
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className={`${ebGaramond.variable} ${inter.className} h-dvh overflow-y-auto scroll-smooth bg-white text-[#1a1c1c] antialiased`}
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

      <section className="relative flex min-h-[90vh] items-center overflow-hidden bg-[#181818] pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 z-10 bg-black/40" />
          <Image
            src="/images/landing/colbari/hero.jpg"
            alt="Professional stock market chart on a dark trading interface"
            fill
            className="object-cover opacity-50 grayscale"
            priority
            sizes="100vw"
          />
        </div>
        <div className="relative z-20 mx-auto w-full max-w-[1440px] px-5 md:px-16">
          <div className="max-w-3xl">
            <h1
              className={`${ebGaramond.className} mb-8 text-[40px] leading-[48px] tracking-[-0.01em] text-white md:text-[64px] md:leading-[72px] md:tracking-[-0.02em]`}
            >
              {t('hero.titleLine1')} <br className="hidden md:block" /> {t('hero.titleLine2')}
            </h1>
            <p className="mb-12 max-w-2xl text-lg leading-7 text-white/80">{t('hero.description')}</p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href={createAccountHref}
                className="bg-white px-10 py-5 text-center text-sm font-medium tracking-[0.15em] text-black uppercase transition-colors duration-500 hover:bg-[#C0A678]"
              >
                {t('hero.createAccount')}
              </Link>
              <Link
                href={tradeHref}
                className="border border-white/30 px-10 py-5 text-center text-sm font-medium tracking-[0.15em] text-white uppercase transition-colors duration-500 hover:bg-white/10"
              >
                {t('hero.trade')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-[120px]">
        <div className="mx-auto max-w-[1440px] px-5 md:px-16">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2
              className={`${ebGaramond.className} mb-6 text-[40px] leading-[48px] text-black italic md:text-[32px] md:leading-[40px]`}
            >
              {t('whyChooseUs.title')}
            </h2>
            <p className="text-base leading-7 text-[#444748] md:text-lg">{t('whyChooseUs.description')}</p>
          </div>
          <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-12">
            <div className="space-y-6 border border-[#c4c7c7]/20 bg-[#F9F9F9] p-8 md:p-10">
              <div className="flex items-center gap-4">
                <IconSchool className="size-8 text-[#C0A678]" stroke={1.5} />
                <h3 className={`${ebGaramond.className} text-2xl leading-8 font-medium`}>
                  {t('beginners.title')}
                </h3>
              </div>
              <ul className="space-y-4 text-base leading-6 text-[#444748]">
                <li className="flex items-center gap-3">
                  <span className="size-1.5 shrink-0 rounded-full bg-black" />
                  {t('beginners.bullet1')}
                </li>
                <li className="flex items-center gap-3">
                  <span className="size-1.5 shrink-0 rounded-full bg-black" />
                  {t('beginners.bullet2')}
                </li>
                <li className="flex items-center gap-3">
                  <span className="size-1.5 shrink-0 rounded-full bg-black" />
                  {t('beginners.bullet3')}
                </li>
              </ul>
              <Link
                href={colbariSiteLinks.education}
                className="inline-block border-b border-black pt-2 text-xs font-semibold tracking-[0.1em] text-black uppercase"
              >
                {t('beginners.cta')}
              </Link>
            </div>
            <div className="space-y-6 border border-[#c4c7c7]/20 bg-[#F9F9F9] p-8 md:p-10">
              <div className="flex items-center gap-4">
                <IconChartLine className="size-8 text-[#C0A678]" stroke={1.5} />
                <h3 className={`${ebGaramond.className} text-2xl leading-8 font-medium`}>
                  {t('experienced.title')}
                </h3>
              </div>
              <ul className="space-y-4 text-base leading-6 text-[#444748]">
                <li className="flex items-center gap-3">
                  <span className="size-1.5 shrink-0 rounded-full bg-black" />
                  {t('experienced.bullet1')}
                </li>
                <li className="flex items-center gap-3">
                  <span className="size-1.5 shrink-0 rounded-full bg-black" />
                  {t('experienced.bullet2')}
                </li>
                <li className="flex items-center gap-3">
                  <span className="size-1.5 shrink-0 rounded-full bg-black" />
                  {t('experienced.bullet3')}
                </li>
              </ul>
              <Link
                href={tradeHref}
                className="inline-block border-b border-black pt-2 text-xs font-semibold tracking-[0.1em] text-black uppercase"
              >
                {t('experienced.cta')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] bg-white px-5 py-[120px] md:px-16">
        <div className="mb-24 text-center">
          <h2
            className={`${ebGaramond.className} mb-4 text-[40px] leading-[48px] text-black italic md:text-[32px] md:leading-[40px]`}
          >
            {t('markets.title')}
          </h2>
          <div className="mx-auto h-px w-24 bg-[#C0A678]" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {marketCardLayout.map((card) => (
            <Link
              key={card.key}
              href={marketCardLinks[card.key]}
              className={`group overflow-hidden border border-[#c4c7c7]/20 ${card.className}`}
            >
              <div className={`overflow-hidden ${card.aspect}`}>
                <Image
                  src={card.image}
                  alt={t(`markets.${card.key}.alt`)}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-8 left-8">
                  <p className="mb-2 text-xs font-semibold tracking-[0.1em] text-white/70 uppercase">
                    {t(`markets.${card.key}.category`)}
                  </p>
                  <h3 className={`${ebGaramond.className} text-2xl leading-8 font-medium text-white`}>
                    {t(`markets.${card.key}.title`)}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[#F9F9F9] py-[120px]">
        <div className="mx-auto max-w-[1440px] px-5 md:px-16">
          <div className="flex flex-col items-center gap-20 lg:flex-row">
            <div className="lg:w-1/2">
              <div className="relative flex min-h-[280px] items-center justify-center border border-[#c4c7c7]/20 bg-white p-12 shadow-2xl md:min-h-[360px] md:p-16">
                <div className="absolute -top-10 -left-10 z-0 h-40 w-40 bg-[#C0A678]/10" />
                <Image
                  src="/images/logo-dark.png"
                  alt={`${appName} logo`}
                  width={320}
                  height={80}
                  className="relative z-10 h-auto w-full max-w-sm object-contain"
                />
              </div>
            </div>
            <div className="lg:w-1/2">
              <h2
                className={`${ebGaramond.className} mb-8 text-[40px] leading-[48px] text-black md:text-[48px] md:leading-[56px]`}
              >
                {t('tradeOnYourTerms.title')}
              </h2>
              <p className="mb-10 text-base leading-7 text-[#444748] md:text-lg">
                {t('tradeOnYourTerms.description')}
              </p>
              <Link
                href={joinHref}
                className="inline-block bg-[#181818] px-12 py-5 text-sm font-medium tracking-[0.2em] text-white uppercase transition active:scale-95"
              >
                {t('tradeOnYourTerms.join', { appName })}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-[120px] text-center md:px-16">
        <h2
          className={`${ebGaramond.className} mb-12 text-[40px] leading-[48px] md:text-[64px] md:leading-[72px] md:tracking-[-0.02em]`}
        >
          {t('confidence.title')}
        </h2>
        <Link
          href={joinHref}
          className="inline-block bg-[#181818] px-12 py-5 text-sm font-medium tracking-[0.2em] text-white uppercase transition active:scale-95"
        >
          {t('confidence.join', { appName })}
        </Link>
      </section>

      <footer className="mt-auto w-full border-t border-[#c4c7c7]/30 bg-[#F9F9F9] px-5 py-16 md:px-16">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-12 flex flex-wrap gap-8 border-b border-[#c4c7c7]/20 pb-12">
            <Link
              href={colbariSiteLinks.legal}
              className="text-sm text-[#444748] transition-colors hover:text-[#C0A678]"
            >
              {t('footer.legal')}
            </Link>
            <Link
              href={colbariSiteLinks.aboutUs}
              className="text-sm text-[#444748] transition-colors hover:text-[#C0A678]"
            >
              {t('footer.aboutUs')}
            </Link>
            <Link
              href={colbariSiteLinks.contactUs}
              className="text-sm text-[#444748] transition-colors hover:text-[#C0A678]"
            >
              {t('footer.contactUs')}
            </Link>
          </div>

          <div className="mb-12 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <Link href="/" className="inline-flex shrink-0" aria-label={appName}>
              <Image
                src="/images/logo-light.png"
                alt={`${appName} logo`}
                width={160}
                height={40}
                className="h-8 w-auto"
              />
            </Link>
            <div className="text-sm text-[#444748]">
              <p className="mb-1 font-medium text-black">{t('footer.customerService')}</p>
              <p>+27 21 891 1885</p>
              <p>
                <a
                  href={`mailto:${supportEmail}`}
                  className="transition-colors hover:text-[#C0A678]"
                >
                  {supportEmail}
                </a>
              </p>
            </div>
          </div>

          <div className="space-y-4 text-[11px] leading-relaxed text-[#444748]/80">
            <p>
              <strong>{t('footer.companyInfo')}</strong> {t('footer.companyInfoBody')}
            </p>
            <p>{t('footer.valorValueBridge')}</p>
            <p>{t('footer.dunfield')}</p>
            <p>
              <strong>{t('footer.riskWarningLabel')}</strong> {t('footer.riskWarningBody')}
            </p>
            <p>{t('footer.antiSpam')}</p>
            <p>
              <strong>{t('footer.regionalRestrictionsLabel')}</strong>{' '}
              {t('footer.regionalRestrictionsBody')}
            </p>
            <p>
              <strong>{t('footer.adviserNotice')}</strong>
            </p>
            <p>
              <strong>{t('footer.riskWarningShortLabel')}</strong> —{' '}
              {t('footer.riskWarningShortBody')}
            </p>
          </div>

          <p className="mt-10 text-[10px] tracking-widest text-[#444748] uppercase">
            {t('footer.copyright', { appName: appName.toUpperCase() })}
          </p>
        </div>
      </footer>
    </main>
  );
}

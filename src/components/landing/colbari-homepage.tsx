import Image from 'next/image';
import Link from 'next/link';
import { EB_Garamond, Inter } from 'next/font/google';
import { IconChartLine, IconSchool } from '@tabler/icons-react';
import { colbariSiteLinks, landingPageLinks } from '@/constants/data';
import {
  LandingHeaderNavMenus,
  LandingHeaderUtilities
} from '@/components/landing/landing-header-nav';

/**
 * Colbari Homepage — adapted from Stitch + https://www.colbari.com/en/
 * Project: 1995405182261882782 | Screen: be0be8bfdee846698a681d98be79d863
 */
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

const marketCards = [
  {
    title: 'Currencies',
    category: 'Foreign Exchange',
    image: '/images/landing/colbari/currencies.jpg',
    alt: 'International currency symbols in a sleek metallic finish',
    className: 'md:col-span-7',
    aspect: 'relative aspect-[16/9]'
  },
  {
    title: 'Stocks',
    category: 'Equities',
    image: '/images/landing/colbari/stocks.jpg',
    alt: 'Conceptual representation of global stock markets',
    className: 'md:col-span-5',
    aspect: 'relative min-h-[300px] md:min-h-[360px]'
  },
  {
    title: 'Commodities',
    category: 'Hard Assets',
    image: '/images/landing/colbari/commodities.jpg',
    alt: 'Gold bars and oil in a curated museum-like setting',
    className: 'md:col-span-4',
    aspect: 'relative aspect-square'
  },
  {
    title: 'Cryptocurrencies',
    category: 'Digital Assets',
    image: '/images/landing/colbari/crypto.jpg',
    alt: 'Futuristic digital coin representations in a virtual space',
    className: 'md:col-span-4',
    aspect: 'relative aspect-square'
  },
  {
    title: 'Indices',
    category: 'Market Baskets',
    image: '/images/landing/colbari/indices.jpg',
    alt: 'Minimalist visualization of global economic indices',
    className: 'md:col-span-4',
    aspect: 'relative aspect-square'
  }
] as const;

const marketCardLinks: Record<(typeof marketCards)[number]['title'], string> = {
  Currencies: colbariSiteLinks.marketsCurrencies,
  Stocks: colbariSiteLinks.marketsStocks,
  Commodities: colbariSiteLinks.marketsCommodities,
  Cryptocurrencies: colbariSiteLinks.marketsCryptocurrencies,
  Indices: colbariSiteLinks.marketsIndices
};

type ColbariHomepageProps = {
  appName: string;
  session: boolean;
  supportEmail: string;
};

export function ColbariHomepage({ appName, session, supportEmail }: ColbariHomepageProps) {
  const createAccountHref = session ? landingPageLinks.trade : landingPageLinks.signUp;
  const tradeHref = session ? landingPageLinks.trade : landingPageLinks.signIn;
  const joinHref = session ? landingPageLinks.trade : landingPageLinks.signUp;

  return (
    <main
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
              Redefining the Way <br className="hidden md:block" /> You Trade
            </h1>
            <p className="mb-12 max-w-2xl text-lg leading-7 text-white/80">
              Step into the world of global trading with access to CFDs on leading asset classes.
              Enjoy 0% commission trading, fast execution, and an intuitive interface designed for
              every level of trader.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href={createAccountHref}
                className="bg-white px-10 py-5 text-center text-sm font-medium tracking-[0.15em] text-black uppercase transition-colors duration-500 hover:bg-[#C0A678]"
              >
                Create Account
              </Link>
              <Link
                href={tradeHref}
                className="border border-white/30 px-10 py-5 text-center text-sm font-medium tracking-[0.15em] text-white uppercase transition-colors duration-500 hover:bg-white/10"
              >
                Trade
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
              Why Choose Us?
            </h2>
            <p className="text-base leading-7 text-[#444748] md:text-lg">
              From entry-level traders to seasoned experienced traders, our platform delivers the
              flexibility and power you need. Access hundreds of CFD instruments with conditions
              designed to maximize your trading experience.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-12">
            <div className="space-y-6 border border-[#c4c7c7]/20 bg-[#F9F9F9] p-8 md:p-10">
              <div className="flex items-center gap-4">
                <IconSchool className="size-8 text-[#C0A678]" stroke={1.5} />
                <h3 className={`${ebGaramond.className} text-2xl leading-8 font-medium`}>Beginners</h3>
              </div>
              <ul className="space-y-4 text-base leading-6 text-[#444748]">
                <li className="flex items-center gap-3">
                  <span className="size-1.5 shrink-0 rounded-full bg-black" />
                  Demo Account with virtual money
                </li>
                <li className="flex items-center gap-3">
                  <span className="size-1.5 shrink-0 rounded-full bg-black" />
                  Educational resources and e-books
                </li>
                <li className="flex items-center gap-3">
                  <span className="size-1.5 shrink-0 rounded-full bg-black" />
                  Assistance from your account manager
                </li>
              </ul>
              <Link
                href={colbariSiteLinks.education}
                className="inline-block border-b border-black pt-2 text-xs font-semibold tracking-[0.1em] text-black uppercase"
              >
                Start Learning
              </Link>
            </div>
            <div className="space-y-6 border border-[#c4c7c7]/20 bg-[#F9F9F9] p-8 md:p-10">
              <div className="flex items-center gap-4">
                <IconChartLine className="size-8 text-[#C0A678]" stroke={1.5} />
                <h3 className={`${ebGaramond.className} text-2xl leading-8 font-medium`}>
                  Experienced traders
                </h3>
              </div>
              <ul className="space-y-4 text-base leading-6 text-[#444748]">
                <li className="flex items-center gap-3">
                  <span className="size-1.5 shrink-0 rounded-full bg-black" />
                  Access to advanced platform features
                </li>
                <li className="flex items-center gap-3">
                  <span className="size-1.5 shrink-0 rounded-full bg-black" />
                  Tools for technical and fundamental analysis
                </li>
                <li className="flex items-center gap-3">
                  <span className="size-1.5 shrink-0 rounded-full bg-black" />
                  Analyze charts and monitor market trends
                </li>
              </ul>
              <Link
                href={tradeHref}
                className="inline-block border-b border-black pt-2 text-xs font-semibold tracking-[0.1em] text-black uppercase"
              >
                Upgrade Tools
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
            Explore Global Markets
          </h2>
          <div className="mx-auto h-px w-24 bg-[#C0A678]" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {marketCards.map((card) => (
            <Link
              key={card.title}
              href={marketCardLinks[card.title]}
              className={`group overflow-hidden border border-[#c4c7c7]/20 ${card.className}`}
            >
              <div className={`overflow-hidden ${card.aspect}`}>
                <Image
                  src={card.image}
                  alt={card.alt}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-8 left-8">
                  <p className="mb-2 text-xs font-semibold tracking-[0.1em] text-white/70 uppercase">
                    {card.category}
                  </p>
                  <h3 className={`${ebGaramond.className} text-2xl leading-8 font-medium text-white`}>
                    {card.title}
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
                Trade on Your Terms
              </h2>
              <p className="mb-10 text-base leading-7 text-[#444748] md:text-lg">
                Our next-generation platform gives you full control across desktop, tablet, and
                mobile. Experience real-time market connectivity, rapid order execution, and advanced
                tools that keep you one step ahead.
              </p>
              <Link
                href={joinHref}
                className="inline-block bg-[#181818] px-12 py-5 text-sm font-medium tracking-[0.2em] text-white uppercase transition active:scale-95"
              >
                Join {appName}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-[120px] text-center md:px-16">
        <h2
          className={`${ebGaramond.className} mb-12 text-[40px] leading-[48px] md:text-[64px] md:leading-[72px] md:tracking-[-0.02em]`}
        >
          Where Confidence Meets Clarity
        </h2>
        <Link
          href={joinHref}
          className="inline-block bg-[#181818] px-12 py-5 text-sm font-medium tracking-[0.2em] text-white uppercase transition active:scale-95"
        >
          Join {appName}
        </Link>
      </section>

      <footer className="mt-auto w-full border-t border-[#c4c7c7]/30 bg-[#F9F9F9] px-5 py-16 md:px-16">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-12 flex flex-wrap gap-8 border-b border-[#c4c7c7]/20 pb-12">
            <Link
              href={colbariSiteLinks.legal}
              className="text-sm text-[#444748] transition-colors hover:text-[#C0A678]"
            >
              Legal
            </Link>
            <Link
              href={colbariSiteLinks.aboutUs}
              className="text-sm text-[#444748] transition-colors hover:text-[#C0A678]"
            >
              About Us
            </Link>
            <Link
              href={colbariSiteLinks.contactUs}
              className="text-sm text-[#444748] transition-colors hover:text-[#C0A678]"
            >
              Contact Us
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
              <p className="mb-1 font-medium text-black">Customer service</p>
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
              <strong>Company Information:</strong> This website &apos;Colbari&apos; is operated by
              Valor Capital (PTY) Ltd, a South African investment firm, authorized and regulated by
              the Financial Sector Conduct Authority of South Africa with Financial Service Provider
              (FSP) license number 51822 to provide intermediary service. Valor Capital (PTY) Ltd is
              registered in South Africa, with registration number 2021/547363/07. Valor Capital (PTY)
              Ltd registered office is located at 1 Edgemere Road Elfindale, Cape Town, 7945, South
              Africa. Valor Capital (PTY) Ltd owns and operates the &quot;Colbari&quot; brand.
            </p>
            <p>
              Valor (PTY) Limited and Value Bridge Single Member Investment Services S.A have a
              common shareholder. Value Bridge Single Member Investment Services S.A, registered at
              43 Aiolou str., 3rd floor, 10551, Athens, Greece, is regulated by the Hellenic Capital
              Market Commission with license number 6/927/31-8-2021.
            </p>
            <p>
              Dunfield Ltd with register address at Office No. 45, 9.17 Capital Tower, 91 Waterloo
              Road, London, United Kingdom SE1 8RT is the paying agent of Valor Capital Ltd.
            </p>
            <p>
              <strong>Risk warning:</strong> Contracts for difference (&apos;CFDs&apos;) is a complex
              financial product, with speculative character, the trading of which involves significant
              risks of loss of capital. Trading CFDs, which is a marginal product, may result in the
              loss of your entire balance. Remember that leverage in CFDs can work both to your
              advantage and disadvantage. CFDs traders do not own, or have any rights to, the underlying
              assets. Trading CFDs is not appropriate for all investors. Past performance does not
              constitute a reliable indicator of future results. Future forecasts do not constitute a
              reliable indicator of future performance. Before deciding to trade, you should carefully
              consider your investment objectives, level of experience and risk tolerance. You should
              not deposit more than you are prepared to lose. Please ensure you fully understand the
              risk associated with the product envisaged and seek independent advice, if necessary.
            </p>
            <p>
              Valor Capital (PTY) Ltd applies strict measures in line with anti-spam regulations by
              avoiding unsolicited advertising.
            </p>
            <p>
              <strong>Regional Restrictions:</strong> Valor Capital (PTY) Ltd does not offer services
              within the European Economic Area as well as in certain other jurisdictions such as the
              USA, British Columbia, Canada, Iran, North Korea, Myanmar, Russia and some other regions.
            </p>
            <p>
              <strong>
                Valor Capital (PTY) Ltd does not issue advice, recommendations or opinions in relation
                to acquiring, holding or disposing of any financial product. Valor Capital (PTY) Ltd is
                not a financial adviser.
              </strong>
            </p>
            <p>
              <strong>Risk Warning</strong> — Trading in CFDs carry a high level of risk to your
              capital due to the volatility of the underlying market. These products may not be
              suitable for all investors. Therefore, you should ensure that you understand the risks
              and seek advice from an independent and suitably licensed financial advisor.
            </p>
          </div>

          <p className="mt-10 text-[10px] tracking-widest text-[#444748] uppercase">
            © 2026 {appName.toUpperCase()}. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>
    </main>
  );
}

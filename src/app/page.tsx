import Image from 'next/image';
import Link from 'next/link';
import {
  IconArrowRight,
  IconBolt,
  IconChartLine,
  IconCircleCheck,
  IconMenu2,
  IconPercentage,
  IconTrendingUp,
  IconUserPlus,
  IconWallet
} from '@tabler/icons-react';
import { landingPageLinks } from '@/constants/data';
import { BrandLogoImage } from '@/components/landing/brand-logo-image';
import { LiveMarketTape } from '@/components/landing/live-market-tape';
import { getAuthSession } from '@/lib/auth';

const whyTradeCards = [
  {
    title: '0 Commission',
    description:
      'Trade US stocks without any commission fees. Keep more of your capital working for you.',
    icon: IconPercentage
  },
  {
    title: 'Instant Execution',
    description:
      'Over 99.35% of orders execute in under one second, with no requotes on all orders.',
    icon: IconBolt
  },
  {
    title: 'Ultra-Low Spreads',
    description:
      'Tier-1 liquidity access delivers tight spreads across major instruments and sessions.',
    icon: IconChartLine
  }
] as const;

const brands = [
  { name: 'Apple', symbol: 'AAPL.US', logo: '/images/stock-logo/aapl.png' },
  { name: 'Tesla', symbol: 'TSLA.US', logo: '/images/stock-logo/tesla.png' },
  { name: 'Amazon', symbol: 'AMZN.US', logo: '/images/stock-logo/amazon.png' },
  { name: 'Meta', symbol: 'META.US', logo: '/images/stock-logo/meta.png' }
] as const;

const startSteps = [
  {
    title: 'Register',
    description: 'Open a free demo or live account in minutes.',
    icon: IconUserPlus
  },
  {
    title: 'Fund',
    description: 'Deposit funds using secure and fast payment methods.',
    icon: IconWallet
  },
  {
    title: 'Trade',
    description: 'Start trading your favorite instruments on our platforms.',
    icon: IconTrendingUp
  }
] as const;

export default async function Page() {
  const session = await getAuthSession();
  const appName = process.env.NEXT_PUBLIC_APP_NAME?.trim() || 'xminvest';
  const openAccountHref = session ? landingPageLinks.trade : landingPageLinks.signUp;
  const getStartedHref = session ? landingPageLinks.trade : landingPageLinks.signIn;

  return (
    <main className="trade-room h-screen overflow-y-auto bg-[var(--trade-dark)] text-[var(--trade-text)]">
      <header className="sticky top-0 z-50 border-b border-[var(--trade-border)] bg-[var(--trade-panel)]/95 backdrop-blur">
        <div className="mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between gap-4 px-6 md:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center"
              aria-label={appName}
            >
              <Image
                src="/images/logo-light.png"
                alt={`${appName} logo`}
                width={160}
                height={40}
                className="h-8 w-auto dark:hidden"
                priority
              />
              <Image
                src="/images/logo-dark.png"
                alt={`${appName} logo`}
                width={160}
                height={40}
                className="hidden h-[50px] w-[50px] dark:block"
                priority
              />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {session ? (
              <Link
                href={landingPageLinks.trade}
                className="rounded bg-[var(--trade-accent-blue)] px-5 py-2.5 text-sm font-semibold text-[#061015] transition hover:opacity-90"
              >
                Trade
              </Link>
            ) : (
              <>
                <Link
                  href={landingPageLinks.signIn}
                  className="hidden px-4 py-2 text-sm text-[var(--trade-text)] hover:text-[var(--trade-accent-blue)] lg:block"
                >
                  Sign In
                </Link>
                <Link
                  href={landingPageLinks.signUp}
                  className="rounded bg-[var(--trade-accent-blue)] px-5 py-2.5 text-sm font-semibold text-[#061015] transition hover:opacity-90"
                >
                  Sign Up
                </Link>
              </>
            )}
            <button className="p-1 text-[var(--trade-text)] md:hidden" aria-label="Open menu">
              <IconMenu2 className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <section className="relative min-h-[620px] overflow-hidden border-b border-[var(--trade-border)] bg-[#05070b]">
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-50"
          poster="/images/video-poster.webp"
          src="/videos/480.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05070b] via-[#05070bdd] to-[#05070b80]" />
        <div className="relative z-10 mx-auto mt-6 w-full max-w-[1440px] px-6 py-20 md:px-8">
          <div className="max-w-2xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--trade-accent-blue)]/40 bg-[var(--trade-accent-blue)]/15 px-3 py-1 text-[11px] uppercase tracking-wide text-[var(--trade-accent-blue)]">
              <IconCircleCheck className="size-3.5" />
              Multi-Award Winning Broker
            </div>
            <h1 className="text-5xl font-bold leading-tight md:text-6xl">
              0% Commission <br />
              <span className="text-[var(--trade-accent-blue)]">on US Stocks</span>
            </h1>
            <p className="max-w-lg text-base leading-7 text-[var(--trade-text-muted)]">
              Trade the world&apos;s most popular instruments with industry-leading execution speeds
              and razor-sharp spreads.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={openAccountHref}
                className="rounded bg-[var(--trade-accent-blue)] px-8 py-3 text-sm font-semibold text-[#061015]"
              >
                Open Account
              </Link>
            </div>
            <p className="pt-2 text-xs text-[var(--trade-text-muted)]">
              *Terms and Conditions apply. Trading involves risk.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--trade-border)] bg-[var(--trade-panel)]">
        <div className="w-full overflow-hidden py-4 motion-reduce:overflow-x-auto motion-reduce:overflow-y-hidden">
          <LiveMarketTape />
        </div>
      </section>

      <section className="bg-[var(--trade-dark)] py-20">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-semibold">{`Why Trade Stocks with ${appName}?`}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] text-[var(--trade-text-muted)]">
              Experience institutional-grade conditions designed for serious investors and active
              day traders alike.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {whyTradeCards.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.title}
                  className="rounded border border-[var(--trade-border)] bg-[var(--trade-panel)] p-8 transition hover:border-[var(--trade-accent-blue)]"
                >
                  <Icon className="mb-6 size-8 text-[var(--trade-accent-blue)]" />
                  <h3 className="text-2xl font-semibold">{card.title}</h3>
                  <p className="mt-3 text-[15px] leading-7 text-[var(--trade-text-muted)]">
                    {card.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#05070b] py-20">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-8">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-xl">
              <h2 className="text-4xl font-semibold">Trade the World&apos;s Biggest Brands</h2>
              <p className="mt-4 text-[15px] text-[var(--trade-text-muted)]">
                Access 1,000+ CFDs on global stocks, commodities, and indices from a single
                interface.
              </p>
            </div>
            <button className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--trade-accent-blue)] hover:underline">
              View All Assets <IconArrowRight className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {brands.map((brand) => (
              <div
                key={brand.symbol}
                className="flex h-48 flex-col items-center justify-center rounded border border-[var(--trade-border)] bg-[var(--trade-panel)] p-6"
              >
                <BrandLogoImage
                  src={brand.logo}
                  alt={`${brand.name} logo`}
                  fallback={brand.name.slice(0, 2).toUpperCase()}
                  wrapperClassName="relative mb-6 flex size-12 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white"
                />
                <span className="text-2xl font-semibold">{brand.name}</span>
                <span className="mt-1 font-mono text-xs text-[var(--trade-text-muted)]">
                  {brand.symbol}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--trade-border)] bg-[var(--trade-dark)] py-20">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-8">
          <h2 className="mb-12 text-center text-4xl font-semibold">Start Trading in 3 Steps</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {startSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className="text-center">
                  <div
                    className={`mx-auto mb-6 flex size-16 items-center justify-center rounded-full ${
                      index === 0
                        ? 'bg-[var(--trade-accent-blue)] text-[#061015]'
                        : 'border border-[var(--trade-border)] bg-[var(--trade-panel)] text-[var(--trade-accent-blue)]'
                    }`}
                  >
                    <Icon className="size-8" />
                  </div>
                  <h3 className="text-2xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-[15px] text-[var(--trade-text-muted)]">{step.description}</p>
                </article>
              );
            })}
          </div>
          <div className="mt-14 text-center">
            <Link
              href={getStartedHref}
              className="inline-flex rounded-full bg-[var(--trade-accent-blue)] px-12 py-4 text-sm font-semibold text-[#061015]"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--trade-border)] bg-[#05070b]">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-6 py-16 md:px-8">
          <div className="flex flex-col justify-between gap-8 md:flex-row">
            <div className="max-w-md">
              <div className="flex items-center gap-3">
                <Image
                  src="/images/logo-light.png"
                  alt={`${appName} logo`}
                  width={160}
                  height={40}
                  className="h-8 w-auto"
                />
                <p className="text-3xl font-bold">{appName}</p>
              </div>
              <p className="mt-4 text-[15px] leading-7 text-[var(--trade-text-muted)]">
                Providing world-class trading services for over a decade. We are committed to
                transparency, reliability, and innovation in global financial markets.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-12 gap-y-6">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold">Legal</span>
                <button className="text-left text-xs text-[var(--trade-text-muted)] hover:text-[var(--trade-text)]">
                  Terms of Service
                </button>
                <button className="text-left text-xs text-[var(--trade-text-muted)] hover:text-[var(--trade-text)]">
                  Privacy Policy
                </button>
                <button className="text-left text-xs text-[var(--trade-text-muted)] hover:text-[var(--trade-text)]">
                  Risk Warning
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold">Support</span>
                <button className="text-left text-xs text-[var(--trade-text-muted)] hover:text-[var(--trade-text)]">
                  Contact Us
                </button>
                <button className="text-left text-xs text-[var(--trade-text-muted)] hover:text-[var(--trade-text)]">
                  FAQ
                </button>
                <button className="text-left text-xs text-[var(--trade-text-muted)] hover:text-[var(--trade-text)]">
                  Cookie Policy
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-[var(--trade-border)]/40 pt-8">
            <p className="text-xs leading-6 text-[var(--trade-text-muted)]/70">
              {`© 2024 ${appName}. All rights reserved. Regulatory disclosure: trading financial`}
              instruments involves significant risk and can result in the loss of invested capital.
              Please review risk disclosure documents before trading.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

import Image from 'next/image';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import {
  IconBrandApple,
  IconBrandFacebook,
  IconBrandGooglePlay,
  IconBrandInstagram,
  IconBrandX,
  IconChartBar,
  IconCheck,
  IconClock,
  IconShieldCheck,
  IconStarFilled,
  IconWorld
} from '@tabler/icons-react';
import { brandLogoSrc, landingHomeBannerAutomatedTradingImage, landingHomeBannerMobileChartImage, landingHomeBannerPlatformsImage, landingHomeBannerPromoItems, landingPageLinks, landingSiteLinks, tradingViewFooterIconSrc } from '@/constants/data';
import { LandingIcHomeBannerCarousel } from '@/components/landing/ic/landing-ic-home-banner-carousel';
import { LandingIcHomeHeader } from '@/components/landing/ic/landing-ic-home-header';
import { LandingIcHomeScrollShell } from '@/components/landing/ic/landing-ic-home-scroll-shell';
import { LandingIcMarketWidgets } from '@/components/landing/ic/landing-ic-market-widgets';
import { LandingIcStatsBar } from '@/components/landing/ic/landing-ic-stats-bar';
import './landing-ic-homepage.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900']
});

type LandingIcHomepageProps = {
  appName: string;
  session: boolean;
};

function CheckBullet() {
  return (
    <div className='mt-0.5 rounded-full bg-[#00ff44] p-0.5'>
      <IconCheck className='size-3 text-white' stroke={3} />
    </div>
  );
}

function BrandLogo({
  appName,
  size = 'lg',
  priority = false
}: {
  appName: string;
  size?: 'lg' | 'sm';
  priority?: boolean;
}) {
  return (
    <Image
      src={brandLogoSrc}
      alt={`${appName} logo`}
      width={160}
      height={40}
      priority={priority}
      className={size === 'lg' ? 'h-12 w-auto' : 'h-8 w-auto'}
    />
  );
}

export function LandingIcHomepage({ appName, session }: LandingIcHomepageProps) {
  const startTradingHref = session ? landingPageLinks.trade : landingPageLinks.signUp;
  const clientLoginHref = landingPageLinks.signIn;
  const demoHref = landingPageLinks.signUp;

  return (
    <LandingIcHomeScrollShell
      className={`${inter.className} landing-ic-scrollbar flex h-dvh flex-col overflow-y-auto scroll-smooth bg-black text-slate-100`}
      header={
        <LandingIcHomeHeader
          appName={appName}
          startTradingHref={startTradingHref}
          clientLoginHref={clientLoginHref}
          scrolled={false}
        />
      }
    >
      {/* Hero */}
      <section className='relative -mt-[88px] flex h-[85vh] min-h-[600px] shrink-0 flex-col overflow-hidden'>
        <LandingIcHomeBannerCarousel appName={appName} ctaHref={startTradingHref} />

        <div className='absolute top-24 left-12 z-20 hidden items-center space-x-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-md md:flex'>
          <div className='flex text-[#00b67a]'>
            {Array.from({ length: 5 }).map((_, i) => (
              <IconStarFilled key={i} className='size-3.5' />
            ))}
          </div>
          <span className='text-[10px] font-semibold text-white'>Trustpilot</span>
        </div>
      </section>

      <LandingIcStatsBar />

      {/* Promo banners */}
      <section className='z-10 shrink-0 border-b border-slate-900 bg-black px-6 py-10 lg:px-12'>
        <div className='mx-auto grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-3'>
          {landingHomeBannerPromoItems.map((item) => (
            <article
              key={item.src}
              className='group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950'
            >
              <div className='relative aspect-[16/9] w-full'>
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes='(max-width: 768px) 100vw, 33vw'
                  className='object-cover object-center transition-transform duration-500 group-hover:scale-105'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent' />
              </div>
              <div className='absolute inset-x-0 bottom-0 space-y-1 p-5'>
                <h3 className='text-lg font-bold text-white'>{item.title}</h3>
                <p className='text-xs leading-relaxed text-slate-300'>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Raw Spread Advantage */}
      <section className='z-10 shrink-0 border-b border-slate-900 bg-black px-6 py-20 lg:px-12'>
        <div className='mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2'>
          <LandingIcMarketWidgets />
          <div className='space-y-6'>
            <h2 className='text-3xl leading-tight font-bold text-white md:text-5xl'>
              The Raw Spread
              <br />
              Advantage
            </h2>
            <p className='text-sm leading-relaxed text-slate-400'>
              Raw Spreads are the difference you have been waiting for. Trade with spreads from 0.0
              pips, no requotes, best possible prices and no restrictions. {appName} is the multi-asset
              trading platform of choice for high volume traders, scalpers and robots.
            </p>
            <div className='flex flex-wrap items-center gap-4 pt-2'>
              <Link
                href={startTradingHref}
                className='rounded bg-[#00ff44] px-8 py-3.5 text-sm font-bold text-black transition hover:bg-[#00cc36]'
              >
                Start Trading
              </Link>
              <Link
                href={demoHref}
                className='rounded border border-white/30 px-8 py-3.5 text-sm font-bold text-white transition hover:border-white'
              >
                Try a Free Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className='shrink-0 bg-[#f4f4f5] px-6 py-20 text-slate-900 lg:px-12'>
        <div className='mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2'>
          <div className='relative flex flex-col items-center justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:col-span-2 md:flex-row lg:p-12'>
            <div className='relative z-10 space-y-6 md:w-1/2'>
              <h3 className='text-3xl font-bold lg:text-4xl'>Spreads from 0.0 pips</h3>
              <ul className='space-y-3 text-sm text-slate-600'>
                <li className='flex items-start gap-3'>
                  <CheckBullet />
                  Raw spreads means really from 0.0 pips*
                </li>
                <li className='flex items-start gap-3'>
                  <CheckBullet />
                  Our diverse and proprietary liquidity mix keeps spreads tight 24/5
                </li>
              </ul>
              <Link
                href={landingSiteLinks.marketsCurrencies}
                className='mt-4 inline-block rounded-lg bg-[#e4e4e7] px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-[#d4d4d8]'
              >
                Pricing Overview
              </Link>
            </div>
            <div className='relative z-10 mt-8 flex justify-end md:mt-0 md:w-1/2'>
              <div className='relative h-96 w-64 overflow-hidden rounded-[2rem] border-8 border-slate-800 bg-[#111] p-2 shadow-2xl'>
                <div className='absolute top-0 left-1/2 z-20 h-4 w-32 -translate-x-1/2 rounded-b-xl bg-black' />
                <div className='flex h-full w-full flex-col rounded-2xl bg-black'>
                  <div className='flex h-12 items-center justify-between border-b border-slate-800 px-3'>
                    <div className='text-[10px] font-bold text-white'>{appName}</div>
                    <div className='text-[10px] text-[#00ff44]'>Live</div>
                  </div>
                  <div className='flex-1 space-y-2 p-3'>
                    <div className='flex items-center justify-between rounded border border-[#00ff44]/30 bg-slate-900 p-2'>
                      <div className='text-[10px] font-bold text-white'>
                        EURUSD <span className='font-normal text-slate-500'>Euro vs US Dollar</span>
                      </div>
                      <div className='text-[10px] text-[#00ff44]'>+0.15%</div>
                    </div>
                    <div className='flex h-32 items-end gap-1 rounded border border-slate-800 bg-slate-900 p-2'>
                      <div className='h-1/2 w-1/6 bg-red-500' />
                      <div className='h-3/4 w-1/6 bg-[#00ff44]' />
                      <div className='h-2/3 w-1/6 bg-red-500' />
                      <div className='h-full w-1/6 bg-[#00ff44]' />
                      <div className='h-5/6 w-1/6 bg-[#00ff44]' />
                      <div className='h-1/3 w-1/6 bg-red-500' />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className='pointer-events-none absolute -right-20 -bottom-20 h-96 w-96 rounded-full border-[40px] border-[#f4f4f5]' />
          </div>

          <div className='relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm lg:p-10'>
            <div className='relative z-10 space-y-6'>
              <h3 className='text-2xl font-bold'>Fast Order Execution</h3>
              <ul className='space-y-3 text-sm text-slate-600'>
                <li className='flex items-start gap-3'>
                  <CheckBullet />
                  Average execution speeds of under 40ms***
                </li>
                <li className='flex items-start gap-3'>
                  <CheckBullet />
                  Low latency fibre optic and Equinix NY4 server
                </li>
                <li className='flex items-start gap-3'>
                  <CheckBullet />
                  Free Low latency collocated VPS available
                </li>
              </ul>
              <Link
                href={landingSiteLinks.faqs}
                className='mt-2 inline-block rounded-lg bg-[#e4e4e7] px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-[#d4d4d8]'
              >
                Get your Free VPS
              </Link>
            </div>
            <IconClock className='pointer-events-none absolute -right-8 -bottom-8 size-64 text-slate-100/80' stroke={1} />
          </div>

          <div className='relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm lg:p-10'>
            <div className='relative z-10 space-y-6'>
              <h3 className='text-2xl font-bold'>Institutional Grade Trading</h3>
              <ul className='space-y-3 text-sm text-slate-600'>
                <li className='flex items-start gap-3'>
                  <CheckBullet />
                  Real, deep and diverse liquidity you can trade on
                </li>
                <li className='flex items-start gap-3'>
                  <CheckBullet />
                  Reduced slippage
                </li>
                <li className='flex items-start gap-3'>
                  <CheckBullet />
                  Billions of USD in FX trades processed daily
                </li>
              </ul>
              <Link
                href={landingSiteLinks.aboutUs}
                className='mt-2 inline-block rounded-lg bg-[#e4e4e7] px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-[#d4d4d8]'
              >
                Raw Pricing Benefits
              </Link>
            </div>
            <IconShieldCheck
              className='pointer-events-none absolute -right-8 -bottom-8 size-64 text-slate-100/80'
              stroke={1}
            />
          </div>
        </div>
      </section>

      {/* Automated Trading CTA */}
      <section className='relative shrink-0 overflow-hidden border-b border-slate-900 bg-[#050505] px-6 py-20 text-center lg:px-12'>
        <Image
          src={landingHomeBannerAutomatedTradingImage}
          alt={`Automated trading on ${appName}`}
          fill
          sizes='100vw'
          className='object-cover object-center opacity-25'
        />
        <div className='absolute inset-0 bg-[#050505]/80' />
        <div className='relative z-10 mx-auto max-w-4xl space-y-8'>
          <div className='flex items-center justify-center gap-2 text-[#00b67a]'>
            <span className='mr-2 text-sm font-bold text-white'>Excellent 4.8/5</span>
            {Array.from({ length: 5 }).map((_, i) => (
              <IconStarFilled key={i} className='size-5' />
            ))}
            <span className='ml-2 text-xs tracking-widest text-slate-400 uppercase'>Trustpilot</span>
          </div>
          <h2 className='text-3xl leading-tight font-bold text-white md:text-5xl'>
            Give your automated trading
            <br />
            system the edge
          </h2>
          <p className='mx-auto max-w-2xl text-sm leading-relaxed text-slate-400'>
            Execute your strategies faster. Our latency reduction technology pairs your account with
            a matching engine located in the New York Equinix NY4 data centre. We process millions of
            trades per day with over two thirds of all trades coming from automated trading systems.
          </p>
          <div className='pt-4'>
            <Link
              href={startTradingHref}
              className='inline-block rounded bg-[#00ff44] px-8 py-3.5 text-sm font-bold text-black shadow-[0_0_20px_rgba(0,255,68,0.2)] transition hover:bg-[#00cc36]'
            >
              Start Trading
            </Link>
          </div>
        </div>
      </section>

      {/* Platforms & Account Steps */}
      <section className='shrink-0 bg-[#f4f4f5] px-6 py-20 text-slate-900 lg:px-12'>
        <div className='mx-auto max-w-6xl'>
          <div className='mb-8 grid items-center gap-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm lg:grid-cols-2 lg:p-12'>
            <div className='space-y-8'>
              <h3 className='text-3xl font-bold lg:text-4xl'>Powerful Trading Terminals</h3>
              <span className='flex items-center gap-1.5 text-lg font-bold'>
                <IconChartBar className='size-6 text-blue-500' />
                TradingView
              </span>
              <div className='grid grid-cols-3 gap-4 text-xs font-semibold text-slate-600'>
                {['Windows', 'Web Browser', 'Android', 'MAC', 'iOS'].map((platform) => (
                  <span key={platform} className='flex items-center gap-1.5'>
                    <div className='rounded-full bg-[#00ff44] p-0.5'>
                      <IconCheck className='size-2.5 text-white' stroke={3} />
                    </div>
                    {platform}
                  </span>
                ))}
              </div>
              <Link
                href={landingSiteLinks.faqs}
                className='inline-block rounded-lg bg-[#e4e4e7] px-8 py-3.5 text-sm font-semibold text-slate-800 transition hover:bg-[#d4d4d8]'
              >
                Platforms
              </Link>
            </div>
            <div className='relative flex h-64 items-center justify-center lg:h-auto lg:justify-end'>
              <div className='relative flex aspect-[16/10] w-full max-w-md items-center justify-center overflow-hidden rounded-xl border-8 border-slate-800 shadow-2xl'>
                <Image
                  src={landingHomeBannerPlatformsImage}
                  alt={`${appName} trading platforms`}
                  fill
                  sizes='(max-width: 1024px) 100vw, 448px'
                  className='object-cover object-center'
                />
              </div>
            </div>
          </div>

          <div className='py-12 text-center'>
            <h2 className='mb-10 text-3xl font-bold'>Open an account in 4 simple steps</h2>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-4'>
              {[
                {
                  step: '1',
                  title: 'Register',
                  text: 'Choose an account type and complete our fast and secure application form'
                },
                {
                  step: '2',
                  title: 'Verify',
                  text: 'Use our digital onboarding system for fast verification'
                },
                {
                  step: '3',
                  title: 'Fund',
                  text: 'Fund your trading account using a wide range of funding methods'
                },
                {
                  step: '4',
                  title: 'Trade',
                  text: 'Start trading on your live account and access +2,850 instruments'
                }
              ].map((item) => (
                <div
                  key={item.step}
                  className='rounded-2xl border border-slate-100 bg-white p-6 text-left shadow-sm'
                >
                  <div className='mb-4 flex size-10 items-center justify-center rounded-full bg-[#00ff44]/20 text-lg font-bold text-green-700'>
                    {item.step}
                  </div>
                  <h4 className='mb-2 text-lg font-bold'>{item.title}</h4>
                  <p className='text-xs leading-relaxed text-slate-500'>{item.text}</p>
                </div>
              ))}
            </div>
            <div className='mt-10'>
              <Link
                href={startTradingHref}
                className='inline-block rounded bg-[#00ff44] px-10 py-3.5 text-sm font-bold text-black transition hover:bg-[#00cc36]'
              >
                Open an account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Promo */}
      <section className='shrink-0 bg-[#f4f4f5] px-6 py-12 lg:px-12'>
        <div className='relative mx-auto flex max-w-5xl flex-col items-center justify-between overflow-hidden rounded-[2rem] bg-black p-8 text-white md:flex-row lg:p-12'>
          <div className='relative z-10 space-y-6 md:w-1/2'>
            <h2 className='text-3xl font-bold lg:text-4xl'>
              Trade on the go with {appName}
              <br />
              mobile app
            </h2>
            <ul className='flex flex-wrap gap-4 text-xs text-slate-300'>
              {['Easy monitoring', '24/7 Support', 'Multiple payment methods'].map((item) => (
                <li key={item} className='flex items-center gap-1.5'>
                  <div className='rounded-full bg-[#00ff44] p-0.5'>
                    <IconCheck className='size-2.5 text-black' stroke={3} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <div className='flex gap-4 pt-2'>
              <button
                type='button'
                className='flex items-center gap-2 rounded-lg border border-slate-700 bg-black px-4 py-2 transition hover:border-slate-500'
              >
                <IconBrandApple className='size-6' />
                <div className='text-left'>
                  <div className='text-[8px] leading-none text-slate-400'>Download on the</div>
                  <div className='text-sm leading-tight font-semibold'>App Store</div>
                </div>
              </button>
              <button
                type='button'
                className='flex items-center gap-2 rounded-lg border border-slate-700 bg-black px-4 py-2 transition hover:border-slate-500'
              >
                <IconBrandGooglePlay className='size-6' />
                <div className='text-left'>
                  <div className='text-[8px] leading-none text-slate-400'>GET IT ON</div>
                  <div className='text-sm leading-tight font-semibold'>Google Play</div>
                </div>
              </button>
            </div>
          </div>
          <div className='relative z-10 mt-10 flex justify-end md:mt-0 md:w-1/2'>
            <div className='relative flex h-72 w-48 rotate-[-5deg] items-center justify-center rounded-3xl border-[6px] border-slate-800 bg-white text-sm font-bold text-black shadow-2xl'>
              App View
            </div>
            <div className='absolute right-10 -bottom-10 h-72 w-48 rotate-[5deg] overflow-hidden rounded-3xl border-[6px] border-slate-800 shadow-2xl'>
              <Image
                src={landingHomeBannerMobileChartImage}
                alt={`Chart view on ${appName} mobile app`}
                fill
                sizes='192px'
                className='object-cover'
              />
            </div>
          </div>
          <IconWorld
            className='pointer-events-none absolute top-1/2 right-0 size-96 -translate-y-1/2 stroke-[0.5] text-white/5'
            stroke={1}
          />
        </div>

        <div className='mx-auto mt-6 flex max-w-5xl flex-col items-center justify-between rounded-xl border border-slate-800 bg-black p-6 sm:flex-row'>
          <span className='font-bold text-white'>Skill up with weekly {appName} WEBINARS</span>
          <Link
            href={landingSiteLinks.economicCalendar}
            className='mt-4 rounded border border-slate-600 px-6 py-2.5 text-xs font-bold text-white transition hover:bg-white hover:text-black sm:mt-0'
          >
            Upcoming Webinars
          </Link>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className='relative shrink-0 overflow-hidden bg-[#050505] px-6 py-24 text-center'>
        <div className='pointer-events-none absolute bottom-0 left-1/2 h-64 w-full -translate-x-1/2 bg-[#00ff44]/5 blur-[120px]' />
        <h2 className='relative z-10 mb-4 text-3xl font-bold text-white md:text-4xl'>
          Instant account opening &amp; funding
        </h2>
        <p className='relative z-10 mb-8 text-slate-400'>Trade within minutes!</p>
        <div className='relative z-10 flex justify-center gap-4'>
          <Link
            href={startTradingHref}
            className='rounded bg-[#00ff44] px-8 py-3.5 text-sm font-bold text-black shadow-[0_0_20px_rgba(0,255,68,0.2)] transition hover:bg-[#00cc36]'
          >
            Get Started
          </Link>
          <Link
            href={demoHref}
            className='rounded border border-slate-600 px-8 py-3.5 text-sm font-bold text-white transition hover:border-white'
          >
            Try a Free Demo
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className='shrink-0 border-t border-slate-900 bg-black px-6 pt-16 pb-8 text-slate-400 lg:px-12'>
        <div className='mx-auto mb-16 grid max-w-7xl grid-cols-1 gap-12 text-xs md:grid-cols-4'>
          <div className='space-y-6'>
            <BrandLogo appName={appName} size='sm' />
            <p className='text-[11px] leading-relaxed text-slate-500'>
              {appName}&apos;s mission is to create the best trading experience for retail and institutional clients
              alike, allowing traders to focus more on their trading. Built by traders for traders,{' '}
              {appName} is dedicated to offering superior spreads, execution and service.
            </p>
            <div className='flex gap-3'>
              {[IconBrandX, IconBrandInstagram, IconBrandFacebook].map((Icon, i) => (
                <div
                  key={i}
                  className='flex size-8 cursor-pointer items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700'
                >
                  <Icon className='size-4' />
                </div>
              ))}
            </div>
            <Link
              href={landingPageLinks.trade}
              className='inline-flex transition hover:opacity-90'
            >
              <Image
                src={tradingViewFooterIconSrc}
                alt='Trade on TradingView'
                width={200}
                height={56}
                className='h-8 w-auto'
              />
            </Link>
          </div>

          <div>
            <h4 className='mb-4 font-bold text-white'>Forex Trading</h4>
            <ul className='space-y-2 text-[11px]'>
              <li>
                <Link href={landingSiteLinks.marketsCurrencies} className='transition hover:text-white'>
                  Accounts Overview
                </Link>
              </li>
              <li>
                <Link href={startTradingHref} className='transition hover:text-white'>
                  Open an Account
                </Link>
              </li>
              <li>
                <Link href={landingPageLinks.trade} className='transition hover:text-white'>
                  Launch Web Trader
                </Link>
              </li>
              <li>
                <Link href={landingSiteLinks.legal} className='transition hover:text-white'>
                  Cybersecurity and Scams
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className='mb-4 font-bold text-white'>Trading Specifications</h4>
            <ul className='space-y-2 text-[11px]'>
              <li>
                <Link href={landingSiteLinks.marketsCurrencies} className='transition hover:text-white'>
                  Spreads and Commissions
                </Link>
              </li>
              <li>
                <Link href={landingSiteLinks.marketsStocks} className='transition hover:text-white'>
                  Range of Products
                </Link>
              </li>
              <li>
                <Link href={landingSiteLinks.economicCalendar} className='transition hover:text-white'>
                  Trading Hours
                </Link>
              </li>
              <li>
                <Link href={landingSiteLinks.contactUs} className='transition hover:text-white'>
                  Funding
                </Link>
              </li>
              <li>
                <Link href={landingSiteLinks.contactUs} className='transition hover:text-white'>
                  Withdrawal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className='mb-4 font-bold text-white'>About {appName}</h4>
            <ul className='space-y-2 text-[11px]'>
              <li>
                <Link href={landingSiteLinks.faqs} className='transition hover:text-white'>
                  Help Centre
                </Link>
              </li>
              <li>
                <Link href={landingSiteLinks.aboutUs} className='transition hover:text-white'>
                  Why {appName}
                </Link>
              </li>
              <li>
                <Link href={landingSiteLinks.legal} className='transition hover:text-white'>
                  Regulation
                </Link>
              </li>
              <li>
                <Link href={landingSiteLinks.legal} className='transition hover:text-white'>
                  Legal Documents
                </Link>
              </li>
              <li>
                <Link href={landingSiteLinks.contactUs} className='transition hover:text-white'>
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className='mx-auto max-w-7xl space-y-3 border-t border-slate-800 pt-8 text-[9px] leading-relaxed text-slate-600'>
          <p>
            {appName} is a trading name of Raw Trading Ltd, which is regulated by
            the Seychelles Financial Services Authority (FSA) with Securities Dealer&apos;s license
            number SD018.
          </p>
          <p>
            <span className='font-bold text-slate-400'>Risk Warning:</span> Trading in securities
            involves significant risk. Prices may fluctuate and securities can become entirely
            valueless. You may incur losses that exceed your potential profits, and in some cases,
            losses may exceed the amount you have deposited. Securities, futures, options, and
            contracts for differences are complex financial instruments and are not suitable for all
            investors. Engaging in such transactions requires a sound understanding of the associated
            risks. Please read and ensure you fully understand our{' '}
            <Link href={landingSiteLinks.legal} className='text-[#00ff44] hover:underline'>
              Risk Disclosure
            </Link>
            .
          </p>
          <p>
            Our leverage is dynamic and may change at any time. Such changes may affect your
            positions and margin requirements. You are responsible for monitoring your positions and
            maintaining sufficient margin at all times.
          </p>
          <p>
            <span className='font-bold text-slate-400'>Restricted Countries:</span> Raw Trading Ltd
            does not provide services for residents of certain countries such as the United States of
            America, Canada, New Zealand, Iran and North Korea (Democratic People&apos;s Republic of
            Korea) or a country where such distribution or use would be contrary to local law or
            regulation.
          </p>
          <p>
            You must be 18 years old, or of legal age as determined in your country. Upon registering
            an account with Raw Trading Ltd, you acknowledge that you are registering at your own
            free will, without solicitation on behalf of Raw Trading Ltd.
          </p>
          <p>
            Raw Trading Ltd does not direct its website and services to any individual in any country
            in which the use of its website and services are prohibited by local laws or regulations.
            When accessing this website from a country in which its use may or may not be prohibited,
            it is the user&apos;s responsibility to ensure that any use of the website or services
            adheres to local laws or regulations. Raw Trading Ltd does not affirm that the information
            on its website is suitable for all jurisdictions.
          </p>
          <div className='mt-4 flex flex-col items-center justify-between border-t border-slate-900 pt-4 sm:flex-row'>
            <span>© 2026 Raw Trading Ltd | All rights reserved.</span>
            <Link href={landingSiteLinks.legal} className='hover:text-slate-300'>
              Legal Documents
            </Link>
          </div>
        </div>
      </footer>
    </LandingIcHomeScrollShell>
  );
}

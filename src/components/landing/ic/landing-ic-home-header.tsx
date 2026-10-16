'use client';

import Image from 'next/image';
import Link from 'next/link';
import { brandLogoSrc, landingPageLinks, landingSiteLinks, sponsorshipIconSrc } from '@/constants/data';

type LandingIcHomeHeaderProps = {
  appName: string;
  startTradingHref: string;
  clientLoginHref: string;
  scrolled: boolean;
};

export function LandingIcHomeHeader({
  appName,
  startTradingHref,
  clientLoginHref,
  scrolled
}: LandingIcHomeHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-30 flex items-center justify-between px-6 py-5 transition-colors duration-300 lg:px-12 ${
        scrolled ? 'border-b border-slate-900 bg-black' : 'bg-transparent'
      }`}
    >
      <div className='flex items-center space-x-12'>
        <div className='flex items-center gap-6'>
          <Link href='/' aria-label={appName} className='inline-flex shrink-0 items-center'>
            <Image
              src={brandLogoSrc}
              alt={`${appName} logo`}
              width={160}
              height={40}
              priority
              className='h-12 w-auto'
            />
          </Link>
          <Link
            href={landingSiteLinks.aboutUs}
            aria-label='Sponsorship'
            className='inline-flex shrink-0 items-center'
          >
            <Image
              src={sponsorshipIconSrc}
              alt='Sponsorship'
              width={80}
              height={40}
              className='h-10 w-auto'
            />
          </Link>
        </div>
        <nav className='hidden items-center space-x-8 text-[13px] font-semibold text-slate-200 xl:flex'>
          <Link href={landingSiteLinks.aboutUs} className='flex items-center gap-1.5 transition hover:text-[#00ff44]'>
            Sponsorship{' '}
            <span className='rounded bg-[#00ff44] px-1.5 py-0.5 text-[9px] font-black tracking-wider text-black uppercase'>
              New
            </span>
          </Link>
          <Link href={startTradingHref} className='transition hover:text-[#00ff44]'>
            Quickstart
          </Link>
          <Link href={landingPageLinks.trade} className='transition hover:text-[#00ff44]'>
            Trading
          </Link>
          <Link href={landingSiteLinks.faqs} className='transition hover:text-[#00ff44]'>
            Platforms
          </Link>
          <Link href={landingSiteLinks.contactUs} className='transition hover:text-[#00ff44]'>
            More
          </Link>
        </nav>
      </div>
      <div className='flex items-center space-x-3'>
        <Link
          href={startTradingHref}
          className='rounded bg-[#00ff44] px-5 py-2.5 text-xs font-bold text-black transition hover:bg-[#00cc36]'
        >
          Start Trading
        </Link>
        <Link
          href={clientLoginHref}
          className='hidden rounded border border-slate-600 px-5 py-2.5 text-xs font-bold text-white transition hover:border-white sm:block'
        >
          Client Login
        </Link>
      </div>
    </header>
  );
}

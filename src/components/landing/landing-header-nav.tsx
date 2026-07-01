'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { IconChevronDown } from '@tabler/icons-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { landingSiteLinks, landingPlaceholderLink } from '@/constants/data';
import { LandingLanguageMenu } from '@/components/landing/landing-language-menu';

const landingHeaderMenuConfig = [
  {
    labelKey: 'markets' as const,
    items: [
      {
        labelKey: 'cryptocurrencies' as const,
        href: landingSiteLinks.marketsCryptocurrencies
      },
      {
        labelKey: 'currencies' as const,
        href: landingSiteLinks.marketsCurrencies
      },
      { labelKey: 'stocks' as const, href: landingSiteLinks.marketsStocks },
      {
        labelKey: 'commodities' as const,
        href: landingSiteLinks.marketsCommodities
      },
      {
        labelKey: 'indices' as const,
        href: landingSiteLinks.marketsIndices
      },
      {
        labelKey: 'pricePrediction' as const,
        href: landingSiteLinks.marketsPricePrediction
      }
    ]
  },
  {
    labelKey: 'learning' as const,
    items: [
      {
        labelKey: 'economicCalendar' as const,
        href: landingSiteLinks.economicCalendar
      },
      { labelKey: 'cfds' as const, href: landingSiteLinks.learningCfds },
      {
        labelKey: 'marketMovers' as const,
        href: landingSiteLinks.learningMarketMovers
      },
      {
        labelKey: 'tradingPitfalls' as const,
        href: landingSiteLinks.learningTradingPitfalls
      },
      {
        labelKey: 'smartTrading' as const,
        href: landingSiteLinks.learningSmartTrading
      },
      {
        labelKey: 'technicalFundamental' as const,
        href: landingSiteLinks.learningTechnicalFundamental
      },
      {
        labelKey: 'glossary' as const,
        href: landingSiteLinks.learningGlossary
      },
      { labelKey: 'nfp' as const, href: landingSiteLinks.learningNfp }
    ]
  },
  {
    labelKey: 'account' as const,
    items: [
      { labelKey: 'aboutUs' as const, href: landingSiteLinks.aboutUs },
      { labelKey: 'faqs' as const, href: landingSiteLinks.faqs }
    ]
  }
] as const;

export function LandingHeaderNavMenus() {
  const t = useTranslations('LandingHeader.menus');

  return (
    <nav className='hidden min-w-0 items-center gap-3 md:flex'>
      {landingHeaderMenuConfig.map((menu) => (
        <DropdownMenu key={menu.labelKey}>
          <DropdownMenuTrigger className='group inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors outline-none hover:text-white/90 focus-visible:ring-2 focus-visible:ring-white/30 data-[state=open]:bg-white data-[state=open]:text-black'>
            {t(menu.labelKey)}
            <IconChevronDown
              className='size-3.5 shrink-0 text-white/80 transition-transform duration-200 group-data-[state=open]:rotate-180 group-data-[state=open]:text-black'
              stroke={2}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='start'
            sideOffset={12}
            className='max-h-[min(70vh,480px)] min-w-[260px] overflow-y-auto rounded-2xl border-0 bg-white p-3 shadow-[0_8px_30px_rgba(0,0,0,0.12)]'
          >
            {menu.items.map((item) => (
              <DropdownMenuItem key={item.labelKey} asChild>
                <Link
                  href={item.href ?? landingPlaceholderLink}
                  className='cursor-pointer rounded-xl px-4 py-3.5 text-base font-normal text-black focus:bg-black/[0.04] focus:text-black'
                >
                  {t(item.labelKey)}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </nav>
  );
}

type LandingHeaderUtilitiesProps = {
  session: boolean;
  signInHref: string;
  signUpHref: string;
  tradeHref: string;
};

export function LandingHeaderUtilities({
  session,
  signInHref,
  signUpHref,
  tradeHref
}: LandingHeaderUtilitiesProps) {
  const t = useTranslations('LandingHeader');

  return (
    <div className='flex shrink-0 items-center gap-4 sm:gap-5'>
      <LandingLanguageMenu />
      <div className='hidden h-5 w-px bg-white/25 sm:block' aria-hidden />
      {session ? (
        <Link
          href={tradeHref}
          className='rounded-md bg-[#6C8471] px-6 py-2 text-sm font-medium text-white transition hover:bg-[#5d7362] active:scale-[0.98]'
        >
          {t('trade')}
        </Link>
      ) : (
        <>
          <Link
            href={signUpHref}
            className='rounded-md bg-[#6C8471] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#5d7362] active:scale-[0.98] sm:px-6'
          >
            {t('signUp')}
          </Link>
          <Link
            href={signInHref}
            className='text-sm font-medium text-white transition-colors hover:text-white/80'
          >
            {t('logIn')}
          </Link>
        </>
      )}
    </div>
  );
}

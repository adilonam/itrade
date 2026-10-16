'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  IconMenu2,
  IconX
} from '@tabler/icons-react';
import {
  landingPageLinks,
  smxLandingAnchors,
  smxLandingNavItems
} from '@/constants/data';
import { LandingLanguageMenu } from '@/components/landing/landing-language-menu';
import { SmxBrandLogo } from '@/components/landing/smx/smx-brand-logo';
import { cn } from '@/lib/utils';

type SmxHeaderProps = {
  session: boolean;
  registerHref: string;
};

export function SmxHeader({ session, registerHref }: SmxHeaderProps) {
  const t = useTranslations('SmxLanding');
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 border-b border-white/10 bg-[#080B11]/90 backdrop-blur-md"
      data-purpose="site-navigation"
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <SmxBrandLogo href="/#top" />
          <nav className="hidden items-center gap-7 text-sm font-medium text-gray-300 lg:flex">
            {smxLandingNavItems.map((item, index) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  'py-1 transition-colors hover:text-[#D8A84E]',
                  index === 0 && 'border-b-2 border-[#D8A84E] text-[#D8A84E]'
                )}
              >
                {t(`nav.${item.key}`)}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:block">
            <LandingLanguageMenu />
          </div>

          <Link
            href={registerHref}
            className="smx-gold-gradient-bg rounded-full px-5 py-2.5 text-sm font-bold text-black shadow-md shadow-[#D8A84E]/20 transition-all hover:brightness-110 active:scale-95 sm:px-6"
          >
            {session ? t('header.tradeDesk') : t('header.openAccount')}
          </Link>

          <button
            type="button"
            aria-label={mobileOpen ? t('header.closeMenu') : t('header.openMenu')}
            aria-expanded={mobileOpen}
            className="p-2 text-gray-300 hover:text-white lg:hidden"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <IconX className="size-5" stroke={2} /> : <IconMenu2 className="size-5" stroke={2} />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-white/10 bg-[#080B11] px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {smxLandingNavItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-xl px-4 py-3 text-sm font-medium text-gray-200 transition-colors hover:bg-white/5 hover:text-[#D8A84E]"
                onClick={() => setMobileOpen(false)}
              >
                {t(`nav.${item.key}`)}
              </a>
            ))}
            <Link
              href={landingPageLinks.signIn}
              className="rounded-xl px-4 py-3 text-sm font-medium text-gray-200 transition-colors hover:bg-white/5 hover:text-[#D8A84E]"
              onClick={() => setMobileOpen(false)}
            >
              {t('header.signIn')}
            </Link>
            <a
              href={smxLandingAnchors.register}
              className="rounded-xl px-4 py-3 text-sm font-medium text-[#D8A84E]"
              onClick={() => setMobileOpen(false)}
            >
              {t('header.registerNow')}
            </a>
            <div className="mt-2 border-t border-white/10 pt-3">
              <LandingLanguageMenu />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

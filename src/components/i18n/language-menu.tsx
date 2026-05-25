'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { IconChevronDown } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { landingLanguages } from '@/constants/data';
import { LandingFlagIcon } from '@/components/landing/landing-flag-icon';
import { setLocale } from '@/actions/set-locale';
import { useWatchTraderPortalContainer } from '@/contexts/watch-trader-portal-context';
import type { Locale } from '@/i18n/config';
import { cn } from '@/lib/utils';

const tradeMenuContentClass = cn(
  'z-[300] min-w-[200px] border shadow-lg',
  '!bg-white text-[#0f172a] border-[#e2e8f0]',
  'dark:!bg-[#05070b] dark:text-[#e6edf3] dark:border-[#2a3441]'
);

const tradeMenuItemClass = cn(
  'flex cursor-pointer items-center gap-3',
  '!bg-transparent text-inherit',
  'focus:!bg-[#e2e8f0] focus:!text-inherit',
  'dark:focus:!bg-[#2a3441] dark:focus:!text-inherit',
  'data-[highlighted]:!bg-[#e2e8f0] data-[highlighted]:!text-inherit',
  'dark:data-[highlighted]:!bg-[#2a3441] dark:data-[highlighted]:!text-inherit'
);

type LanguageMenuProps = {
  variant?: 'landing' | 'trade';
};

export function LanguageMenu({ variant = 'landing' }: LanguageMenuProps) {
  const router = useRouter();
  const locale = useLocale() as Locale;
  const t = useTranslations('Language');
  const tCommon = useTranslations('Common');
  const [isPending, startTransition] = useTransition();
  const tradePortalContainer = useWatchTraderPortalContainer();

  const currentLanguage =
    landingLanguages.find((lang) => lang.code === locale) ?? landingLanguages[0];

  const handleSelect = (code: Locale) => {
    if (code === locale) {
      return;
    }

    startTransition(async () => {
      await setLocale(code);
      router.refresh();
    });
  };

  const isTrade = variant === 'trade';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isPending}>
        {isTrade ? (
          <Button
            variant="secondary"
            size="icon"
            className="size-8 shrink-0"
            aria-label={tCommon('selectLanguage')}
          >
            <LandingFlagIcon
              country={currentLanguage.flag}
              className="h-3 w-[18px] rounded-[2px]"
            />
          </Button>
        ) : (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-sm px-1 py-1 text-white transition-opacity outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-60"
            aria-label={tCommon('selectLanguage')}
          >
            <LandingFlagIcon
              country={currentLanguage.flag}
              className="h-3.5 w-5 rounded-[2px]"
            />
            <IconChevronDown className="size-3.5 text-white/70" stroke={2} />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        container={isTrade ? (tradePortalContainer ?? undefined) : undefined}
        className={cn(!isTrade && 'min-w-[200px]', isTrade && tradeMenuContentClass)}
      >
        {landingLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            className={cn(
              'flex cursor-pointer items-center gap-3',
              isTrade && tradeMenuItemClass
            )}
            onSelect={() => handleSelect(lang.code)}
          >
            <LandingFlagIcon country={lang.flag} className="h-3.5 w-5 shrink-0 rounded-[2px]" />
            <span>{t(lang.code)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

'use client';

import Link from 'next/link';
import { IconChevronDown } from '@tabler/icons-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { landingDefaultLanguage, landingLanguages } from '@/constants/data';
import { LandingFlagIcon } from '@/components/landing/landing-flag-icon';

export function LandingLanguageMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center gap-1.5 rounded-sm px-1 py-1 text-white transition-opacity outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-white/30"
        aria-label="Select language"
      >
        <LandingFlagIcon country={landingDefaultLanguage.flag} className="h-3.5 w-5 rounded-[2px]" />
        <IconChevronDown className="size-3.5 text-white/70" stroke={2} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        {landingLanguages.map((lang) => (
          <DropdownMenuItem key={lang.code} asChild>
            <Link href={lang.href} className="flex cursor-pointer items-center gap-3">
              <LandingFlagIcon country={lang.flag} className="h-3.5 w-5 shrink-0 rounded-[2px]" />
              <span>{lang.label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

'use client';

import { Check, Languages } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { setLocale } from '@/actions/set-locale';
import { type Locale, locales } from '@/i18n/config';
import { cn } from '@/lib/utils';

const LANGUAGE_OPTIONS: {
  code: Locale;
  flag: string;
  labelKey: 'english' | 'arabic';
}[] = [
  { code: 'en', flag: '🇬🇧', labelKey: 'english' },
  { code: 'ar', flag: '🇸🇦', labelKey: 'arabic' }
];

export function LanguageDropdown() {
  const t = useTranslations('Language');
  const locale = useLocale() as Locale;
  const router = useRouter();

  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  async function selectLanguage(nextLocale: Locale) {
    if (nextLocale === locale) {
      setOpen(false);
      return;
    }

    await setLocale(nextLocale);
    setOpen(false);
    router.refresh();
  }

  return (
    <div ref={containerRef} className='relative'>
      <button
        type='button'
        aria-label={t('triggerLabel')}
        aria-expanded={open}
        aria-haspopup='listbox'
        onClick={() => setOpen((current) => !current)}
        className='text-on-surface-variant hover:text-primary flex items-center transition-colors'
      >
        <Languages className='size-5' />
      </button>

      {open ? (
        <div
          role='listbox'
          aria-label={t('triggerLabel')}
          className={cn(
            'bg-surface-white text-on-surface border-outline-variant dark:border-on-secondary-container absolute end-0 top-[calc(100%+0.5rem)] z-50 w-72 overflow-hidden rounded-2xl border shadow-xl'
          )}
        >
          <ul className='max-h-56 overflow-y-auto py-1'>
            {LANGUAGE_OPTIONS.map((language) => {
              const isSelected = language.code === locale;

              return (
                <li key={language.code}>
                  <button
                    type='button'
                    role='option'
                    aria-selected={isSelected}
                    onClick={() => selectLanguage(language.code)}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2.5 text-start text-sm transition-colors',
                      isSelected
                        ? 'bg-surface-container-low text-primary dark:bg-surface-container-high/60 dark:text-primary-fixed-dim'
                        : 'text-on-surface hover:bg-surface-container-low dark:hover:bg-on-secondary-fixed-variant'
                    )}
                  >
                    <span className='text-base leading-none' aria-hidden>
                      {language.flag}
                    </span>
                    <span className='min-w-0 flex-1 font-medium'>
                      {t(language.labelKey)}
                    </span>
                    {isSelected ? (
                      <Check className='text-primary dark:text-primary-fixed-dim size-4 shrink-0' />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export { locales };

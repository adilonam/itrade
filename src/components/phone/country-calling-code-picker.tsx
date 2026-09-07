'use client';

import { useMemo, useState } from 'react';
import { IconCheck, IconChevronDown } from '@tabler/icons-react';
import type { CountryCode } from 'libphonenumber-js';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  DEFAULT_PHONE_COUNTRY,
  getCountryCallingCodeOptions,
  getCountryOption
} from '@/lib/country-calling-codes';
import { cn } from '@/lib/utils';

type CountryCallingCodePickerProps = {
  value?: CountryCode;
  onChange: (country: CountryCode) => void;
  locale?: string;
  disabled?: boolean;
  variant?: 'default' | 'smx';
  searchPlaceholder?: string;
  emptyLabel?: string;
  className?: string;
  id?: string;
};

export function CountryCallingCodePicker({
  value = DEFAULT_PHONE_COUNTRY,
  onChange,
  locale = 'en',
  disabled = false,
  variant = 'default',
  searchPlaceholder = 'Search country…',
  emptyLabel = 'No country found',
  className,
  id
}: CountryCallingCodePickerProps) {
  const [open, setOpen] = useState(false);
  const options = useMemo(
    () => getCountryCallingCodeOptions(locale),
    [locale]
  );
  const selected = useMemo(
    () => getCountryOption(value, locale),
    [value, locale]
  );
  const isSmx = variant === 'smx';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type='button'
          disabled={disabled}
          dir='ltr'
          aria-label={`${selected.name} ${selected.dialCode}`}
          className={cn(
            'flex shrink-0 items-center justify-between gap-1.5 text-xs transition-colors',
            isSmx
              ? 'smx-glass-input w-[7.25rem] rounded-xl border px-2.5 py-3 text-white focus:ring-0'
              : 'h-9 w-[7.25rem] rounded-md border border-[var(--trade-border)] bg-[var(--trade-dark)] px-2.5 text-[var(--trade-text)] hover:bg-[var(--trade-dark)]/80',
            disabled && 'cursor-not-allowed opacity-50',
            className
          )}
        >
          <span className='truncate'>
            {selected.flag} {selected.dialCode}
          </span>
          <IconChevronDown
            className={cn(
              'size-2.5 shrink-0',
              isSmx ? 'text-gray-400' : 'text-[var(--trade-text-muted)]'
            )}
            stroke={2}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        className={cn(
          'w-72 p-0',
          isSmx &&
            'border-[#D8A84E]/30 bg-[#101521]/95 text-white backdrop-blur-md'
        )}
        dir='ltr'
      >
        <Command
          className={cn(isSmx && 'bg-transparent text-white')}
          filter={(value, search) => {
            const q = search.trim().toLowerCase();
            if (!q) return 1;
            return value.toLowerCase().includes(q) ? 1 : 0;
          }}
        >
          <CommandInput
            placeholder={searchPlaceholder}
            className={cn(isSmx && 'text-white placeholder:text-gray-500')}
          />
          <CommandList className='max-h-64'>
            <CommandEmpty
              className={cn(isSmx && 'text-gray-400')}
            >
              {emptyLabel}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.code}
                  value={`${option.name} ${option.dialCode} ${option.code}`}
                  onSelect={() => {
                    onChange(option.code);
                    setOpen(false);
                  }}
                  className={cn(
                    isSmx &&
                      'text-white data-[selected=true]:bg-[#D8A84E]/20 data-[selected=true]:text-white'
                  )}
                >
                  <span className='mr-1'>{option.flag}</span>
                  <span className='min-w-0 flex-1 truncate'>{option.name}</span>
                  <span
                    className={cn(
                      'ml-auto tabular-nums',
                      isSmx ? 'text-gray-400' : 'text-muted-foreground'
                    )}
                  >
                    {option.dialCode}
                  </span>
                  <IconCheck
                    className={cn(
                      'size-3.5',
                      value === option.code ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

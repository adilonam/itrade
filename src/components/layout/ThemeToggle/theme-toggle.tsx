'use client';

import { IconBrightness } from '@tabler/icons-react';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export function ModeToggle() {
  const t = useTranslations('Common');
  const { setTheme, resolvedTheme } = useTheme();
  const { data: session } = useSession();

  const handleThemeToggle = React.useCallback(
    async (e?: React.MouseEvent) => {
      const newMode = resolvedTheme === 'dark' ? 'light' : 'dark';
      const root = document.documentElement;

      // Save to user preferences if authenticated
      if (session?.user) {
        try {
          await fetch('/api/user/theme-settings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ themeMode: newMode })
          });
        } catch {
          // Best-effort; theme still toggles locally
        }
      }

      if (!document.startViewTransition) {
        setTheme(newMode);
        return;
      }

      // Set coordinates from the click event
      if (e) {
        root.style.setProperty('--x', `${e.clientX}px`);
        root.style.setProperty('--y', `${e.clientY}px`);
      }

      document.startViewTransition(() => {
        setTheme(newMode);
      });
    },
    [resolvedTheme, setTheme, session]
  );

  return (
    <Button
      variant='secondary'
      size='icon'
      className='group/toggle size-8'
      onClick={handleThemeToggle}
    >
      <IconBrightness />
      <span className='sr-only'>{t('toggleTheme')}</span>
    </Button>
  );
}

'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import { UserNav } from './user-nav';
import { ModeToggle } from './ThemeToggle/theme-toggle';
import { useSession } from 'next-auth/react';
import { IconWallet } from '@tabler/icons-react';

interface FinancialData {
  balance: number;
  usedMargin: number;
  equity: number;
  freeMargin: number;
  marginLevel: number | null;
  totalPnL: number;
  leverage: number;
}

export default function Header({
  variant = 'default'
}: {
  variant?: 'default' | 'compact';
}) {
  const { data: session } = useSession();
  const [financialData, setFinancialData] = useState<FinancialData | null>(
    null
  );

  // Load financial data from API
  const loadFinancialData = useCallback(async () => {
    try {
      const response = await fetch('/api/user/financial');
      if (!response.ok) {
        throw new Error('Failed to fetch financial data');
      }
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Invalid response type');
      }
      const data = await response.json();
      setFinancialData(data);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to load financial data:', err);
    }
  }, []);

  // Fetch financial data every 5 seconds
  useEffect(() => {
    if (!session?.user) return;

    // Initial fetch
    loadFinancialData();

    // Set up interval to fetch every 100 seconds
    const interval = setInterval(() => {
      loadFinancialData();
    }, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [loadFinancialData, session?.user]);

  const headerActions = (
    <div className='flex items-center gap-0 rounded-lg border border-border bg-muted/50 px-1 py-0.5 dark:bg-muted/30'>
      {session?.user && financialData && (
        <>
          <div
            className='hidden select-text items-center gap-1.5 px-3 py-1.5 sm:flex'
            title='Free margin'
          >
            <IconWallet className='text-muted-foreground size-3.5 shrink-0' />
            <span
              className={`font-mono text-sm font-bold tabular-nums ${
                financialData.freeMargin >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-destructive'
              }`}
            >
              ${financialData.freeMargin.toFixed(2)}
            </span>
          </div>
          <Separator orientation='vertical' className='mx-0.5 h-5' />
        </>
      )}
      <div className='flex items-center'>
        <ModeToggle />
      </div>
      <Separator orientation='vertical' className='mx-0.5 h-5' />
      <div className='flex items-center pr-0.5'>
        <UserNav />
      </div>
    </div>
  );

  if (variant === 'compact') {
    return headerActions;
  }

  return (
    <header className='flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
      <div className='flex items-center gap-2 px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 h-4' />
        <Breadcrumbs />
      </div>
      {headerActions}
    </header>
  );
}

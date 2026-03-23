'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import SearchInput from '../search-input';
import { UserNav } from './user-nav';
import { ModeToggle } from './ThemeToggle/theme-toggle';
import { useSession } from 'next-auth/react';
import { Badge } from '../ui/badge';
import { Wallet } from 'lucide-react';

interface FinancialData {
  balance: number;
  usedMargin: number;
  equity: number;
  freeMargin: number;
  marginLevel: number | null;
  totalPnL: number;
  leverage: number;
}

export default function Header() {
  const { data: session } = useSession();
  const [financialData, setFinancialData] = useState<FinancialData | null>(
    null
  );

  // Load financial data from API
  const loadFinancialData = useCallback(async () => {
    try {
      const response = await fetch('/api/user/financial?balanceType=REAL');
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

  return (
    <header className='flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
      <div className='flex items-center gap-2 px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 h-4' />
        <Breadcrumbs />
      </div>

      <div className='flex items-center gap-2 px-4'>
        {session?.user && financialData && (
          <Badge
            variant='outline'
            className={`hidden items-center gap-1 px-3 py-1 sm:flex ${
              financialData.freeMargin >= 0
                ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            <Wallet className='h-3 w-3' />
            <span className='text-xs font-medium'>
              ${financialData.freeMargin.toFixed(2)}
            </span>
          </Badge>
        )}
        <ModeToggle />
        <UserNav />
      </div>
    </header>
  );
}

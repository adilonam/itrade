'use client';
import React from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import SearchInput from '../search-input';
import { UserNav } from './user-nav';
import { ModeToggle } from './ThemeToggle/theme-toggle';
import { useSession } from 'next-auth/react';
import { Badge } from '../ui/badge';
import { Wallet } from 'lucide-react';

export default function Header() {
  const { data: session } = useSession();
  const userBalance = session?.user?.balance ?? 0;

  return (
    <header className='flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
      <div className='flex items-center gap-2 px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 h-4' />
        <Breadcrumbs />
      </div>

      <div className='flex items-center gap-2 px-4'>
        <div className='hidden md:flex'>
          <SearchInput />
        </div>
        {session?.user && (
          <Badge
            variant='outline'
            className='hidden items-center gap-1 border-green-200 bg-green-50 px-3 py-1 text-green-700 hover:bg-green-100 sm:flex'
          >
            <Wallet className='h-3 w-3' />
            <span className='text-xs font-medium'>
              ${userBalance.toFixed(2)}
            </span>
          </Badge>
        )}
        <ModeToggle />
        <UserNav />
      </div>
    </header>
  );
}

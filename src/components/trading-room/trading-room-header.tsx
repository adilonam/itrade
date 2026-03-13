'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  IconWallet,
  IconSettings,
  IconBell,
  IconChartBar
} from '@tabler/icons-react';

export function TradingRoomHeader({
  isGuest = false
}: {
  isGuest?: boolean;
  profit?: number | null;
}) {
  return (
    <header className='flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4'>
      <div className='flex items-center gap-4'>
        {isGuest && (
          <span className='rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400'>
            GUEST MODE
          </span>
        )}
      </div>

      <div className='flex flex-1' />

      <div className='flex items-center gap-2'>
        <Button variant='ghost' size='icon' className='size-8 rounded-full transition-colors duration-200 hover:bg-muted' aria-label='Chart'>
          <IconChartBar className='size-4' />
        </Button>
        <Button variant='ghost' size='icon' className='size-8 rounded-full transition-colors duration-200 hover:bg-muted' aria-label='Notifications'>
          <IconBell className='size-4' />
        </Button>
        <Button variant='ghost' size='icon' className='size-8 rounded-full transition-colors duration-200 hover:bg-muted' aria-label='Settings'>
          <IconSettings className='size-4' />
        </Button>
        <Button
          asChild
          className='rounded-full bg-primary px-5 text-primary-foreground transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-md active:scale-[0.98]'
        >
          <Link href='/dashboard'>
            <IconWallet className='mr-2 size-4' />
            Deposit
          </Link>
        </Button>
      </div>
    </header>
  );
}

'use client';

import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  IconWallet,
  IconSettings,
  IconBell,
  IconChartBar
} from '@tabler/icons-react';

const NAV_ITEMS = [
  { value: 'trade', label: 'Trade' },
  { value: 'prop', label: 'Prop' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'copy-trading', label: 'Copy Trading' },
  { value: 'explore', label: 'Explore' }
];

export function TradingRoomHeader({
  isGuest = false,
  profit
}: {
  isGuest?: boolean;
  profit?: number | null;
}) {
  return (
    <header className='flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4'>
      <div className='flex items-center gap-4'>
        <Link
          href='/'
          className='flex items-center gap-2 font-semibold text-foreground'
        >
          <span className='text-lg'>Match Trader</span>
        </Link>
        {isGuest && (
          <span className='rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400'>
            GUEST MODE
          </span>
        )}
      </div>

      <div className='flex flex-1 items-center justify-center gap-2'>
        <Tabs defaultValue='trade' className='w-auto'>
          <TabsList className='h-8 gap-1 rounded-full bg-muted/50 p-1'>
            {NAV_ITEMS.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className='rounded-full border-0 px-4 transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm'
              >
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {typeof profit === 'number' && (
          <span className='text-muted-foreground ml-2 text-sm'>Profit</span>
        )}
      </div>

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

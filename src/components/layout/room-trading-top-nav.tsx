'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const ROOM_TRADING_NAV_ITEMS = [
  { title: 'Dashboard', url: '/markets-room-trading' },
  { title: 'Overview Test', url: '/overview-test' },
  { title: 'My Positions', url: '/positions-room-trading' },
  { title: 'My Transactions', url: '/transactions?type=trade' },
  { title: 'News', url: '/news' },
  { title: 'Withdraw', url: '/withdraw' },
  { title: 'Deposit', url: '/deposit' },
  { title: 'Account', url: '/profile' }
];

export function RoomTradingTopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      <div
        role="tablist"
        className="inline-flex h-8 w-fit items-center justify-center gap-1 rounded-full bg-muted/50 p-1"
      >
        {ROOM_TRADING_NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.url ||
            (item.url.startsWith('/transactions') &&
              pathname?.startsWith('/transactions')) ||
            (item.url === '/markets-room-trading' &&
              pathname?.startsWith('/trading-view-room-trading'));

          return (
            <Link
              key={item.url}
              href={item.url}
              className={cn(
                'rounded-full border-0 px-3 py-1.5 text-sm font-medium transition-all duration-200',
                'hover:bg-muted/70',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {item.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

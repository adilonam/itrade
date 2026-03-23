'use client';

import Header from './header';
import { RoomTradingTopNav } from './room-trading-top-nav';
import { WatchTraderHeader } from './watch-trader-header';
import { MarketsWebSocketProvider } from '@/contexts/markets-websocket-context';
import KBar from '@/components/kbar';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

function isWatchTraderRoute(pathname: string | null) {
  if (!pathname) return false;
  return (
    pathname === '/trade' ||
    pathname.startsWith('/trading-view-room-trading')
  );
}

export function DashboardLayoutClient({
  children
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const pathname = usePathname();
  const watchTrader = isWatchTraderRoute(pathname);

  return (
    <KBar>
      <div
        className={cn(
          'flex min-h-screen w-full flex-col',
          watchTrader && 'watch-trader-shell bg-[var(--trade-dark)] text-[var(--trade-text)]'
        )}
      >
        {watchTrader ? (
          <WatchTraderHeader />
        ) : (
          <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4">
            <RoomTradingTopNav />
            <Header variant="compact" />
          </header>
        )}
        <main
          className={cn(
            'flex min-h-0 flex-1 flex-col overflow-auto',
            watchTrader && 'min-h-0 overflow-hidden'
          )}
        >
          <MarketsWebSocketProvider>
            {watchTrader ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
            ) : (
              children
            )}
          </MarketsWebSocketProvider>
        </main>
      </div>
    </KBar>
  );
}

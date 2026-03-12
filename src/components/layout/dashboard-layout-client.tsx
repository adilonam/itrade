'use client';

import Header from './header';
import { RoomTradingTopNav } from './room-trading-top-nav';
import { MarketsWebSocketProvider } from '@/contexts/markets-websocket-context';
import KBar from '@/components/kbar';

export function DashboardLayoutClient({
  children
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <KBar>
      <div className="flex min-h-screen w-full flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4">
          <RoomTradingTopNav />
          <Header variant="compact" />
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-auto">
          <MarketsWebSocketProvider>{children}</MarketsWebSocketProvider>
        </main>
      </div>
    </KBar>
  );
}

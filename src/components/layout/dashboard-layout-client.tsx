'use client';

import { WatchTraderHeader } from './watch-trader-header';
import { MarketsWebSocketProvider } from '@/contexts/markets-websocket-context';
import { TradingRoomShell } from '@/components/trading-room/trading-room-shell';
import KBar from '@/components/kbar';

export function DashboardLayoutClient({
  children
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <KBar>
      <div className="watch-trader-shell flex min-h-screen w-full flex-col bg-[var(--trade-dark)] text-[var(--trade-text)]">
        <WatchTraderHeader />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <MarketsWebSocketProvider>
            <TradingRoomShell>{children}</TradingRoomShell>
          </MarketsWebSocketProvider>
        </main>
      </div>
    </KBar>
  );
}

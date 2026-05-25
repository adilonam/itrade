'use client';

import { Suspense } from 'react';
import { useLocale } from 'next-intl';
import { WatchTraderHeader } from './watch-trader-header';
import { MarketsWebSocketProvider } from '@/contexts/markets-websocket-context';
import { TradingRoomShell } from '@/components/trading-room/trading-room-shell';
import { WatchTraderShellWithPortal } from '@/contexts/watch-trader-portal-context';
import KBar from '@/components/kbar';
import { useTranslations } from 'next-intl';

function TradingRoomShellSuspenseFallback() {
  const t = useTranslations('Common');
  return (
    <div className="trade-room flex h-[calc(100dvh-2.75rem)] max-h-[calc(100dvh-2.75rem)] min-h-0 w-full min-w-0 flex-col overflow-hidden bg-[var(--trade-dark)] text-[var(--trade-text)]">
      <main className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-hidden">
        <p className="text-sm text-[var(--trade-text-muted)]">{t('loading')}</p>
      </main>
    </div>
  );
}

export function DashboardLayoutClient({
  children
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const locale = useLocale();
  return (
    <KBar>
      <WatchTraderShellWithPortal
        className="watch-trader-shell flex min-h-screen w-full flex-col bg-[var(--trade-dark)] text-[var(--trade-text)]"
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
      >
        <WatchTraderHeader />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <MarketsWebSocketProvider>
            <Suspense fallback={<TradingRoomShellSuspenseFallback />}>
              <TradingRoomShell>{children}</TradingRoomShell>
            </Suspense>
          </MarketsWebSocketProvider>
        </main>
      </WatchTraderShellWithPortal>
    </KBar>
  );
}

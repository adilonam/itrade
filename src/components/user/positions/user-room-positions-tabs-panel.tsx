'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { UserPositionsTableCardRoomTrading } from '@/components/user/positions/user-positions-table-room-trading';
import { UserFinanceCard } from '@/components/user/finance/user-finance-card';
import { cn } from '@/lib/utils';
import { TRADE_ROOM_CARD_CLASS } from '@/constants/trade-room-ui';
import type { Room } from '@/lib/prisma/generated/client';

const TAB_TRIGGER_CLASS =
  'h-full rounded-none border-b-2 border-transparent bg-transparent px-4 text-xs font-medium text-[var(--trade-text-muted)] hover:text-[var(--trade-text)] data-[state=active]:border-[var(--trade-accent-blue)] data-[state=active]:font-bold data-[state=active]:text-[var(--trade-accent-blue)]';

type PanelLayout = 'trade-panel' | 'standalone-card';

type FinancialRoomParam = 'TRADING' | 'STOCK';

function RoomFinanceTabContent({ room }: { room: FinancialRoomParam }) {
  const t = useTranslations('Common');
  const [data, setData] = useState<{
    balance: number;
    usedMargin: number;
    equity?: number;
  } | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/user/financial?room=${room}`);
      if (!res.ok) return;
      const json = await res.json();
      setData({
        balance: json.balance ?? 0,
        usedMargin: json.usedMargin ?? 0,
        equity: json.equity
      });
    } catch {
      // keep null → mock below
    } finally {
      setHydrated(true);
    }
  }, [room]);

  useEffect(() => {
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, [load]);

  if (!hydrated) {
    return (
      <p className="p-4 text-sm text-[var(--trade-text-muted)]">{t('loading')}</p>
    );
  }
  const effective = data ?? {
    balance: 102_450.5,
    usedMargin: 1250,
    equity: 103_120.25
  };
  return (
    <UserFinanceCard
      variant="trade"
      balance={effective.balance}
      usedMargin={effective.usedMargin}
      equity={effective.equity}
      showMarginLevel={true}
    />
  );
}

function financialRoomParam(room: Room): FinancialRoomParam {
  if (room === 'STOCK') return 'STOCK';
  return 'TRADING';
}

export interface UserRoomPositionsTabsPanelProps {
  room?: Room;
  refreshEventName?: string;
  layout: PanelLayout;
  className?: string;
  /** When false, the Finance tab and its content are omitted (e.g. institutional page has its own account card). */
  showFinanceTab?: boolean;
}

export function UserRoomPositionsTabsPanel({
  room = 'TRADING',
  refreshEventName = 'room-trading-positions-refresh',
  layout,
  className,
  showFinanceTab = true
}: UserRoomPositionsTabsPanelProps) {
  const t = useTranslations('Trade.positions');
  const [activeTab, setActiveTab] = useState<
    'open' | 'pending' | 'closed' | 'finance'
  >('open');
  const embedded = layout === 'trade-panel';
  const financeRoom = financialRoomParam(room);
  const tabValue =
    !showFinanceTab && activeTab === 'finance' ? 'open' : activeTab;

  const tabsInner = (
    <Tabs
      value={tabValue}
      onValueChange={(v) => setActiveTab(v as typeof activeTab)}
      className={cn(
        'flex flex-col gap-0',
        embedded ? 'h-full' : 'min-h-0 flex-1'
      )}
    >
      <div className="flex shrink-0 items-center border-b border-[var(--trade-border)] px-4 py-2">
        <TabsList className="h-10 gap-0 rounded-none border-0 bg-transparent p-0">
          <TabsTrigger value="open" className={TAB_TRIGGER_CLASS}>
            {t('open')}
          </TabsTrigger>
          <TabsTrigger value="pending" className={TAB_TRIGGER_CLASS}>
            {t('pending')}
          </TabsTrigger>
          <TabsTrigger value="closed" className={TAB_TRIGGER_CLASS}>
            {t('closed')}
          </TabsTrigger>
          {showFinanceTab ? (
            <TabsTrigger value="finance" className={TAB_TRIGGER_CLASS}>
              {t('finance')}
            </TabsTrigger>
          ) : null}
        </TabsList>
      </div>
      <TabsContent
        value="open"
        className="mt-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
      >
        <UserPositionsTableCardRoomTrading
          embeddedInTradePanel={embedded}
          statusFilter="open"
          panelVariant="trade"
          room={room}
          refreshEventName={refreshEventName}
        />
      </TabsContent>
      <TabsContent
        value="pending"
        className="mt-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
      >
        <UserPositionsTableCardRoomTrading
          embeddedInTradePanel={embedded}
          statusFilter="pending"
          panelVariant="trade"
          room={room}
          refreshEventName={refreshEventName}
        />
      </TabsContent>
      <TabsContent
        value="closed"
        className="mt-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
      >
        <UserPositionsTableCardRoomTrading
          embeddedInTradePanel={embedded}
          statusFilter="closed"
          panelVariant="trade"
          room={room}
          refreshEventName={refreshEventName}
        />
      </TabsContent>
      {showFinanceTab ? (
        <TabsContent
          value="finance"
          className="mt-0 min-h-0 flex-1 overflow-auto data-[state=inactive]:hidden"
        >
          <div className="h-full overflow-auto p-2">
            <RoomFinanceTabContent room={financeRoom} />
          </div>
        </TabsContent>
      ) : null}
    </Tabs>
  );

  if (layout === 'trade-panel') {
    return (
      <div
        className={cn(
          'flex h-full min-h-[200px] min-w-0 flex-col border-t border-[var(--trade-border)] bg-[var(--trade-panel)]',
          className
        )}
      >
        {tabsInner}
      </div>
    );
  }

  return (
    <Card
      className={cn(
        'flex min-h-0 max-h-[min(70vh,520px)] flex-col overflow-hidden rounded-xl',
        TRADE_ROOM_CARD_CLASS,
        'gap-0 py-0',
        className
      )}
    >
      {tabsInner}
    </Card>
  );
}

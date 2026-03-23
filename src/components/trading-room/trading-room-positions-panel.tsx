'use client';

import { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { UserPositionsTableCardRoomTrading } from '@/components/user/positions/user-positions-table-room-trading';
import { UserFinanceCard } from '@/components/user/finance/user-finance-card';
import { IconDownload, IconFilter } from '@tabler/icons-react';

export function TradingRoomPositionsPanel() {
  const [activeTab, setActiveTab] = useState<'open' | 'pending' | 'closed' | 'finance'>('open');

  return (
    <div className="flex h-full min-h-[200px] min-w-0 flex-col border-t border-[var(--trade-border)] bg-[var(--trade-panel)]">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex h-full flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--trade-border)] px-4 py-2">
          <TabsList className="h-10 gap-0 rounded-none border-0 bg-transparent p-0">
            <TabsTrigger value="open" className="h-full rounded-none border-b-2 border-transparent bg-transparent px-4 text-xs font-medium text-[var(--trade-text-muted)] data-[state=active]:border-[var(--trade-accent-blue)] data-[state=active]:font-bold data-[state=active]:text-[var(--trade-accent-blue)] hover:text-[var(--trade-text)]">Open Positions</TabsTrigger>
            <TabsTrigger value="pending" className="h-full rounded-none border-b-2 border-transparent bg-transparent px-4 text-xs font-medium text-[var(--trade-text-muted)] hover:text-[var(--trade-text)] data-[state=active]:border-[var(--trade-accent-blue)] data-[state=active]:font-bold data-[state=active]:text-[var(--trade-accent-blue)]">Pending Orders</TabsTrigger>
            <TabsTrigger value="closed" className="h-full rounded-none border-b-2 border-transparent bg-transparent px-4 text-xs font-medium text-[var(--trade-text-muted)] hover:text-[var(--trade-text)] data-[state=active]:border-[var(--trade-accent-blue)] data-[state=active]:font-bold data-[state=active]:text-[var(--trade-accent-blue)]">Closed Positions</TabsTrigger>
            <TabsTrigger value="finance" className="h-full rounded-none border-b-2 border-transparent bg-transparent px-4 text-xs font-medium text-[var(--trade-text-muted)] hover:text-[var(--trade-text)] data-[state=active]:border-[var(--trade-accent-blue)] data-[state=active]:font-bold data-[state=active]:text-[var(--trade-accent-blue)]">Finance</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-1 text-[var(--trade-text-muted)]">
            <button type="button" className="rounded p-1.5 hover:text-[var(--trade-text)]" aria-label="Filter"><IconFilter className="size-4" /></button>
            <button type="button" className="rounded p-1.5 hover:text-[var(--trade-text)]" aria-label="Download"><IconDownload className="size-4" /></button>
          </div>
        </div>
        <TabsContent value="open" className="mt-0 min-h-0 flex-1 overflow-auto data-[state=inactive]:hidden">
          <div className="h-full overflow-auto">
            <UserPositionsTableCardRoomTrading statusFilter="open" />
          </div>
        </TabsContent>
        <TabsContent value="pending" className="mt-0 min-h-0 flex-1 overflow-auto data-[state=inactive]:hidden">
          <div className="h-full overflow-auto">
            <UserPositionsTableCardRoomTrading statusFilter="pending" />
          </div>
        </TabsContent>
        <TabsContent value="closed" className="mt-0 min-h-0 flex-1 overflow-auto data-[state=inactive]:hidden">
          <div className="h-full overflow-auto">
            <UserPositionsTableCardRoomTrading statusFilter="closed" />
          </div>
        </TabsContent>
        <TabsContent value="finance" className="mt-0 min-h-0 flex-1 overflow-auto data-[state=inactive]:hidden">
          <div className="h-full overflow-auto p-2">
            <TradingRoomFinanceTab />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TradingRoomFinanceTab() {
  const [data, setData] = useState<{ balance: number; usedMargin: number; equity?: number } | null>(
    null
  );
  const [hydrated, setHydrated] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/user/financial?room=TRADING');
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
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, [load]);

  if (!hydrated) {
    return <p className="p-4 text-sm text-[var(--trade-text-muted)]">Loading…</p>;
  }
  const effective = data ?? {
    balance: 102_450.5,
    usedMargin: 1250,
    equity: 103_120.25
  };
  return (
    <UserFinanceCard
      balance={effective.balance}
      usedMargin={effective.usedMargin}
      equity={effective.equity}
      showMarginLevel={true}
    />
  );
}

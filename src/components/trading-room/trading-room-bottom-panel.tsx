'use client';

import { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { UserPositionsTableCardRoomTrading } from '@/components/user/positions/user-positions-table-room-trading';
import { UserFinanceCard } from '@/components/user/finance/user-finance-card';
import { IconDownload, IconFilter } from '@tabler/icons-react';

const GUEST_MSG =
  "You don't have any open positions because you are in guest mode.";

export function TradingRoomBottomPanel({ guestMode = false }: { guestMode?: boolean }) {
  const [activeTab, setActiveTab] = useState<'open' | 'pending' | 'closed' | 'finance'>('open');

  return (
    <div className="flex h-[240px] min-h-0 flex-col border-t border-border bg-background">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex h-full flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
          <TabsList className="h-8 gap-1 rounded-full bg-muted/50 p-1">
            <TabsTrigger value="open" className="rounded-full border-0 px-3 text-sm transition-all duration-200 hover:bg-muted/70 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">Open Positions</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-full border-0 px-3 text-sm transition-all duration-200 hover:bg-muted/70 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">Pending Orders</TabsTrigger>
            <TabsTrigger value="closed" className="rounded-full border-0 px-3 text-sm transition-all duration-200 hover:bg-muted/70 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">Closed Positions</TabsTrigger>
            <TabsTrigger value="finance" className="rounded-full border-0 px-3 text-sm transition-all duration-200 hover:bg-muted/70 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">Finance</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-1">
            <button type="button" className="rounded p-1.5 text-muted-foreground hover:text-foreground" aria-label="Filter"><IconFilter className="size-4" /></button>
            <button type="button" className="rounded p-1.5 text-muted-foreground hover:text-foreground" aria-label="Download"><IconDownload className="size-4" /></button>
          </div>
        </div>
        <TabsContent value="open" className="mt-0 min-h-0 flex-1 overflow-auto data-[state=inactive]:hidden">
          {guestMode ? (
            <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">GUEST MODE</span>
              <p className="text-sm text-muted-foreground">{GUEST_MSG}</p>
            </div>
          ) : (
            <div className="h-full overflow-auto">
              <UserPositionsTableCardRoomTrading statusFilter="open" />
            </div>
          )}
        </TabsContent>
        <TabsContent value="pending" className="mt-0 min-h-0 flex-1 overflow-auto data-[state=inactive]:hidden">
          {guestMode ? (
            <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">GUEST MODE</span>
              <p className="text-sm text-muted-foreground">{GUEST_MSG}</p>
            </div>
          ) : (
            <div className="h-full overflow-auto">
              <UserPositionsTableCardRoomTrading statusFilter="pending" />
            </div>
          )}
        </TabsContent>
        <TabsContent value="closed" className="mt-0 min-h-0 flex-1 overflow-auto data-[state=inactive]:hidden">
          {guestMode ? (
            <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">GUEST MODE</span>
              <p className="text-sm text-muted-foreground">{GUEST_MSG}</p>
            </div>
          ) : (
            <div className="h-full overflow-auto">
              <UserPositionsTableCardRoomTrading statusFilter="closed" />
            </div>
          )}
        </TabsContent>
        <TabsContent value="finance" className="mt-0 min-h-0 flex-1 overflow-auto data-[state=inactive]:hidden">
          {guestMode ? (
            <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">GUEST MODE</span>
              <p className="text-sm text-muted-foreground">{GUEST_MSG}</p>
            </div>
          ) : (
            <div className="h-full overflow-auto p-2">
              <TradingRoomFinanceTab />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TradingRoomFinanceTab() {
  const [data, setData] = useState<{ balance: number; usedMargin: number; equity?: number } | null>(null);

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
      // ignore
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, [load]);

  if (!data) return <p className="text-sm text-muted-foreground">Loading…</p>;
  return (
    <UserFinanceCard
      balance={data.balance}
      usedMargin={data.usedMargin}
      equity={data.equity}
      showMarginLevel={true}
    />
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@/components/ui/resizable';
import { TradingRoomHeader } from './trading-room-header';
import { TradingRoomSidebar, type SymbolItem } from './trading-room-sidebar';
import { TradingViewRoomTrading } from '@/components/trading-view/trading-view-room-trading';
import { UserPositionsTableCardRoomTrading } from '@/components/user/positions/user-positions-table-room-trading';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { IconDownload, IconFilter } from '@tabler/icons-react';
import { MOCK_SYMBOLS } from './mock-data';
import type { Market } from '@/lib/prisma/generated/client';
import { toTradingViewSymbol } from '@/lib/market-symbol';
import { toast } from 'sonner';

const GUEST_MSG =
  "You don't have any open positions because you are in guest mode. Open a live account, start trading and you will see your open positions here.";

function TradingRoomBottomPanel({ guestMode }: { guestMode: boolean }) {
  return (
    <div className="flex h-[240px] min-h-0 flex-col border-t border-border bg-background">
      <Tabs defaultValue="open" className="flex h-full flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
          <TabsList className="h-8 gap-1 rounded-full bg-muted/50 p-1">
            <TabsTrigger value="open" className="rounded-full border-0 px-3 text-sm transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
              Open Positions
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-full border-0 px-3 text-sm transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
              Pending Orders
            </TabsTrigger>
            <TabsTrigger value="closed" className="rounded-full border-0 px-3 text-sm transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
              Closed Positions
            </TabsTrigger>
            <TabsTrigger value="finance" className="rounded-full border-0 px-3 text-sm transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
              Finance
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-1">
            <button type="button" className="rounded-lg p-1.5 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground" aria-label="Filter">
              <IconFilter className="size-4" />
            </button>
            <button type="button" className="rounded-lg p-1.5 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground" aria-label="Download">
              <IconDownload className="size-4" />
            </button>
          </div>
        </div>
        <TabsContent value="open" className="mt-0 min-h-0 flex-1 overflow-auto data-[state=inactive]:hidden">
          {guestMode ? (
            <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                GUEST MODE
              </span>
              <p className="text-sm text-muted-foreground">{GUEST_MSG}</p>
            </div>
          ) : (
            <div className="h-full overflow-auto">
              <UserPositionsTableCardRoomTrading />
            </div>
          )}
        </TabsContent>
        <TabsContent value="pending" className="mt-0 flex flex-1 items-center justify-center data-[state=inactive]:hidden">
          <p className="text-sm text-muted-foreground">No pending orders</p>
        </TabsContent>
        <TabsContent value="closed" className="mt-0 flex flex-1 items-center justify-center data-[state=inactive]:hidden">
          <p className="text-sm text-muted-foreground">Closed positions will appear here</p>
        </TabsContent>
        <TabsContent value="finance" className="mt-0 flex flex-1 items-center justify-center data-[state=inactive]:hidden">
          <p className="text-sm text-muted-foreground">Deposits and withdrawals</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface TradingRoomLayoutProps {
  initialMarket: Market | null;
  initialSymbols?: Market[];
}

export function TradingRoomLayout({
  initialMarket,
  initialSymbols = []
}: TradingRoomLayoutProps) {
  const searchParams = useSearchParams();
  const pk = searchParams.get('pk');
  const { data: session } = useSession();
  const [symbols, setSymbols] = useState<SymbolItem[]>(() =>
    initialSymbols.length > 0 ? initialSymbols : [...MOCK_SYMBOLS]
  );
  const [selectedSymbolId, setSelectedSymbolId] = useState<string | null>(
    initialMarket?.id ?? pk ?? (symbols[0]?.id ?? null)
  );
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(initialMarket);
  const isGuest = !session?.user;

  useEffect(() => {
    if (initialSymbols.length > 0) return;
    let cancelled = false;
    fetch('/api/markets?room=TRADING')
      .then((r) => r.ok ? r.json() : null)
      .then((data: { markets?: Market[] } | null) => {
        if (cancelled || !data?.markets?.length) return;
        setSymbols(data.markets);
        const fromPk = pk && data.markets.find((m) => m.id === pk);
        if (fromPk && !selectedMarket) {
          setSelectedSymbolId(fromPk.id);
          setSelectedMarket(fromPk);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [initialSymbols.length, pk, selectedMarket]);

  useEffect(() => {
    if (!pk || !initialMarket) return;
    setSelectedSymbolId(pk);
    setSelectedMarket(initialMarket);
  }, [pk, initialMarket?.id]);

  const selectedSymbol = symbols.find((s) => s.id === selectedSymbolId);
  const chartSymbol = selectedMarket
    ? toTradingViewSymbol(selectedMarket)
    : selectedSymbol
      ? (selectedSymbol as { symbol: string }).symbol
      : 'EURUSD';

  const handleSelectSymbol = useCallback((id: string, market: Market | null) => {
    setSelectedSymbolId(id);
    setSelectedMarket(market);
  }, []);

  const handleMarketOrder = useCallback(
    async (type: 'BUY' | 'SELL', quantity: number) => {
      if (!session?.user?.id || !selectedMarket) {
        toast.error('Sign in and select a market to trade');
        return;
      }
      try {
        const res = await fetch('/api/user/positions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            status: 'PLACED',
            room: 'TRADING',
            marketId: selectedMarket.id,
            quantity,
            description: `${type} ${quantity} lots`
          })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Order failed');
        }
        toast.success(`${type} order placed`);
        window.dispatchEvent(new CustomEvent('room-trading-positions-refresh'));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Order failed');
      }
    },
    [session?.user?.id, selectedMarket]
  );

  return (
    <div className="flex h-[calc(100dvh-52px)] flex-col overflow-hidden bg-background">
      <TradingRoomHeader isGuest={isGuest} />
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={22} minSize={18} maxSize={35} className="flex flex-col">
          <TradingRoomSidebar
            symbols={symbols}
            selectedSymbolId={selectedSymbolId}
            selectedMarket={selectedMarket}
            onSelectSymbol={handleSelectSymbol}
            onMarketOrder={handleMarketOrder}
            guestMode={isGuest}
          />
        </ResizablePanel>
        <ResizableHandle withHandle className="bg-border" />
        <ResizablePanel defaultSize={78} minSize={50} className="flex flex-col">
          <div className="min-h-0 flex-1">
            <TradingViewRoomTrading
              symbol={chartSymbol}
              interval="60"
              height="100%"
              width="100%"
            />
          </div>
          <TradingRoomBottomPanel guestMode={isGuest} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

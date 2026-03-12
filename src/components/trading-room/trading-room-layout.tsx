'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@/components/ui/resizable';
import { TradingRoomSidebar, type SymbolItem } from './trading-room-sidebar';
import { TradingRoomBottomPanel } from './trading-room-bottom-panel';
import { TradingRoomNewsSidebar } from './trading-room-news-sidebar';
import { TradingViewRoomTrading } from '@/components/trading-view/trading-view-room-trading';
import { MOCK_SYMBOLS } from './mock-data';
import type { Market } from '@/lib/prisma/generated/client';
import { toTradingViewSymbol } from '@/lib/market-symbol';
import { toast } from 'sonner';
import { IconMessageCircle } from '@tabler/icons-react';

interface TradingRoomLayoutProps {
  initialMarket: Market | null;
  initialSymbols?: Market[];
  /** When true, symbol selection updates chart in-place without URL changes */
  noNavigation?: boolean;
}

export function TradingRoomLayout({
  initialMarket,
  initialSymbols = [],
  noNavigation = false
}: TradingRoomLayoutProps) {
  const searchParams = useSearchParams();
  const pk = noNavigation ? null : searchParams.get('pk');
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
    <div className="trade-room flex h-[calc(100dvh-52px)] flex-col overflow-hidden bg-[var(--trade-dark)] text-white">
      <main className="flex min-h-0 flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left sidebar - symbols */}
          <ResizablePanel defaultSize={18} minSize={12} maxSize={35} className="flex min-w-0 flex-col overflow-hidden">
            <aside className="flex h-full min-w-0 flex-col border-r border-[var(--trade-border)] bg-[var(--trade-panel)]">
              <TradingRoomSidebar
                symbols={symbols}
                selectedSymbolId={selectedSymbolId}
                selectedMarket={selectedMarket}
                onSelectSymbol={handleSelectSymbol}
                onMarketOrder={handleMarketOrder}
                guestMode={isGuest}
                noNavigation={noNavigation}
              />
            </aside>
          </ResizablePanel>
          <ResizableHandle withHandle className="shrink-0 bg-[var(--trade-border)]" />
          {/* Center - chart + bottom panel */}
          <ResizablePanel defaultSize={52} minSize={35} className="flex min-w-0 flex-col overflow-hidden">
            <ResizablePanelGroup direction="vertical" className="min-h-0 flex-1">
              <ResizablePanel defaultSize={70} minSize={30} className="flex min-h-0 flex-col overflow-hidden">
                <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--trade-dark)]">
                  <TradingViewRoomTrading
                    symbol={chartSymbol}
                    interval="60"
                    height="100%"
                    width="100%"
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle className="shrink-0 bg-[var(--trade-border)]" />
              <ResizablePanel defaultSize={30} minSize={15} maxSize={50} className="flex flex-col shrink-0 min-h-0">
                <TradingRoomBottomPanel guestMode={isGuest} />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle withHandle className="shrink-0 bg-[var(--trade-border)]" />
          {/* Right sidebar - news */}
          <ResizablePanel defaultSize={30} minSize={18} maxSize={45} className="flex min-w-0 flex-col overflow-hidden">
            <TradingRoomNewsSidebar />
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
      {/* Floating Let's Chat button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-[var(--trade-border)] bg-[var(--trade-panel)] px-4 py-2 text-sm font-medium text-white shadow-xl transition-all hover:scale-105 hover:bg-[var(--trade-border)]"
        >
          <span>Let&apos;s Chat</span>
          <IconMessageCircle className="size-5" />
        </button>
      </div>
    </div>
  );
}

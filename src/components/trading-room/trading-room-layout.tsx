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
import { TradingRoomBottomPanel } from './trading-room-bottom-panel';
import { TradingViewRoomTrading } from '@/components/trading-view/trading-view-room-trading';
import { MOCK_SYMBOLS } from './mock-data';
import type { Market } from '@/lib/prisma/generated/client';
import { toTradingViewSymbol } from '@/lib/market-symbol';
import { toast } from 'sonner';

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
            noNavigation={noNavigation}
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

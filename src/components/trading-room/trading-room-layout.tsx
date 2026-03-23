'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@/components/ui/resizable';
import { TradingRoomMarketsPanel, type SymbolItem } from './trading-room-markets-panel';
import { TradingRoomPositionsPanel } from './trading-room-positions-panel';
import { TradingRoomNewsPanel } from './trading-room-news-panel';
import {
  TradingRoomAdvancedOrderPanel,
  type AdvancedOrderMarket
} from './trading-room-advanced-order-panel';
import { TradingRoomChart } from './trading-room-chart';
import { type ChartInterval } from './trading-room-chart-header';
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

function isMarketItem(item: SymbolItem): item is Market {
  return 'room' in item && typeof (item as Market).room === 'string';
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
  const [advancedOrderOpen, setAdvancedOrderOpen] = useState(false);
  const [chartInterval, setChartInterval] = useState<ChartInterval>('60');
  const signedIn = Boolean(session?.user);

  const selectedSymbol = symbols.find((s) => s.id === selectedSymbolId);
  const getPrice = (item: SymbolItem) =>
    isMarketItem(item) ? item.lastPrice : (item as { price: number }).price;
  const getSymbol = (item: SymbolItem) => item.symbol;
  const getName = (item: SymbolItem) =>
    isMarketItem(item) ? item.name : (item as { name: string }).name;

  const advancedOrderMarket: AdvancedOrderMarket = selectedMarket
    ? selectedMarket
    : selectedSymbol
      ? {
          symbol: getSymbol(selectedSymbol),
          lastPrice: getPrice(selectedSymbol),
          spread: 0.00002
        }
      : null;

  // When the left panel is resized down to 30% of its original width, we want it to fully collapse
  // (width -> 0) so the chart panel can use the remaining space.
  const leftPanelInitialSizeRef = useRef<number | null>(null);
  const [leftPanelMinSize, setLeftPanelMinSize] = useState(14);
  const [leftCollapseEnabled, setLeftCollapseEnabled] = useState(false);

  const handleHorizontalLayout = useCallback((sizes: number[]) => {
    if (leftPanelInitialSizeRef.current != null) return;
    const initialLeftSize = sizes[0] ?? 20;
    leftPanelInitialSizeRef.current = initialLeftSize;

    // With `collapsedSize=0`, react-resizable-panels collapses around the halfway point between
    // collapsedSize and minSize. That means collapse threshold is roughly `minSize / 2`.
    // We want: minSize/2 = 30% of initialLeftSize => minSize = 60% of initialLeftSize.
    // Bias slightly upward because the library collapses when `size < halfwayPoint` (strict).
    const computedMinSize = Math.max(1, Math.min(100, initialLeftSize * 0.61));
    setLeftPanelMinSize(computedMinSize);
    setLeftCollapseEnabled(true);
  }, []);

  // Right side vertical split (Chart on top / Positions on bottom):
  // collapse the bottom panel when it shrinks to ~30% of its initial height.
  const bottomPanelInitialSizeRef = useRef<number | null>(null);
  const [bottomPanelMinSize, setBottomPanelMinSize] = useState(20);
  const [bottomCollapseEnabled, setBottomCollapseEnabled] = useState(false);

  const handleRightVerticalLayout = useCallback((sizes: number[]) => {
    if (bottomPanelInitialSizeRef.current != null) return;
    const initialBottomSize = sizes[1] ?? 0;
    bottomPanelInitialSizeRef.current = initialBottomSize;

    // With collapsedSize=0, collapse happens around `minSize/2` (strict),
    // so we set `minSize ≈ 2 * (0.30 * initialBottomSize)` => 0.60 * initial.
    const computedMinSize = Math.max(1, Math.min(100, initialBottomSize * 0.61));
    setBottomPanelMinSize(computedMinSize);
    setBottomCollapseEnabled(true);
  }, []);

  useEffect(() => {
    if (initialSymbols.length > 0) return;
    let cancelled = false;
    fetch('/api/markets?room=TRADING')
      .then((r) => (r.ok ? r.json() : null))
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
    return () => {
      cancelled = true;
    };
  }, [initialSymbols.length, pk, selectedMarket]);

  useEffect(() => {
    if (!pk || !initialMarket) return;
    setSelectedSymbolId(pk);
    setSelectedMarket(initialMarket);
  }, [pk, initialMarket]);

  const chartSymbol = selectedMarket
    ? toTradingViewSymbol(selectedMarket)
    : selectedSymbol
      ? (selectedSymbol as { symbol: string }).symbol
      : 'EURUSD';

  const headerLastPrice = selectedSymbol ? getPrice(selectedSymbol) : 1.15578;

  const handleSelectSymbol = useCallback((id: string, market: Market | null) => {
    setSelectedSymbolId(id);
    setSelectedMarket(market);
  }, []);

  const handleMarketOrder = useCallback(
    async (type: 'BUY' | 'SELL', quantity: number, limitPrice?: number) => {
      if (!session?.user?.id || !selectedMarket) {
        toast.error('Sign in and select a market to trade');
        return;
      }
      const isPending = limitPrice != null;
      try {
        const body: Record<string, unknown> = {
          type,
          status: isPending ? 'PENDING' : 'PLACED',
          room: 'TRADING',
          marketId: selectedMarket.id,
          quantity,
          description: isPending
            ? `${type} ${quantity} lots @ ${limitPrice}`
            : `${type} ${quantity} lots`
        };
        if (isPending) body.executedPrice = limitPrice;
        const res = await fetch('/api/user/positions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Order failed');
        }
        toast.success(
          isPending ? `${type} limit order placed` : `${type} order placed`
        );
        window.dispatchEvent(new CustomEvent('room-trading-positions-refresh'));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Order failed');
      }
    },
    [session?.user?.id, selectedMarket]
  );

  return (
    <div className="trade-room flex h-[calc(100dvh-2.75rem)] max-h-[calc(100dvh-2.75rem)] min-h-0 w-full min-w-0 flex-col overflow-hidden bg-[var(--trade-dark)] text-[var(--trade-text)]">
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <ResizablePanelGroup
          direction="horizontal"
          className="min-h-0 min-w-0 flex-1"
          onLayout={handleHorizontalLayout}
        >
          <ResizablePanel
            defaultSize={20}
            minSize={leftPanelMinSize}
            maxSize={32}
            collapsible={leftCollapseEnabled}
            collapsedSize={0}
            className="flex min-w-0 flex-col overflow-hidden"
          >
            {advancedOrderOpen && advancedOrderMarket ? (
              <TradingRoomAdvancedOrderPanel
                key={advancedOrderMarket.symbol}
                market={advancedOrderMarket}
                onClose={() => setAdvancedOrderOpen(false)}
                onMarketOrder={handleMarketOrder}
                disabled={!signedIn}
              />
            ) : (
              <div className="flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden border-r border-[var(--trade-border)] bg-[var(--trade-panel)]">
                <ResizablePanelGroup direction="vertical" className="h-full min-h-0 min-w-0 w-full flex-1">
                  <ResizablePanel defaultSize={52} minSize={28} className="flex min-h-0 flex-col overflow-hidden">
                    <TradingRoomMarketsPanel
                      symbols={symbols}
                      selectedSymbolId={selectedSymbolId}
                      selectedMarket={selectedMarket}
                      onSelectSymbol={handleSelectSymbol}
                      onMarketOrder={handleMarketOrder}
                      onAdvancedOrderClick={() => setAdvancedOrderOpen(true)}
                      tradingDisabled={!signedIn}
                      noNavigation={noNavigation}
                    />
                  </ResizablePanel>
                  <ResizableHandle withHandle className="shrink-0 bg-[var(--trade-border)]" />
                  <ResizablePanel defaultSize={48} minSize={22} maxSize={65} className="flex min-h-0 flex-col overflow-hidden">
                    <TradingRoomNewsPanel
                      variant="underMarkets"
                      symbol={chartSymbol}
                      symbolFullName={
                        selectedSymbol ? getName(selectedSymbol) : 'Euro vs US Dollar'
                      }
                    />
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>
            )}
          </ResizablePanel>
          <ResizableHandle withHandle className="shrink-0 bg-[var(--trade-border)]" />
          <ResizablePanel defaultSize={80} minSize={50} className="flex min-h-0 min-w-0 flex-col overflow-hidden">
            <ResizablePanelGroup
              direction="vertical"
              className="h-full min-h-0 min-w-0 w-full flex-1"
              onLayout={handleRightVerticalLayout}
            >
              <ResizablePanel defaultSize={68} minSize={40} className="flex min-h-0 flex-col overflow-hidden">
                <TradingRoomChart
                  symbol={chartSymbol}
                  interval={chartInterval}
                  onIntervalChange={setChartInterval}
                  lastPrice={headerLastPrice}
                />
              </ResizablePanel>
              <ResizableHandle withHandle className="shrink-0 bg-[var(--trade-border)]" />
              <ResizablePanel
                defaultSize={32}
                minSize={bottomPanelMinSize}
                maxSize={55}
                collapsible={bottomCollapseEnabled}
                collapsedSize={0}
                className="flex min-h-0 min-w-0 flex-col overflow-hidden"
              >
                <TradingRoomPositionsPanel />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
      <div className="fixed bottom-4 right-4 z-50">
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-[var(--trade-border)] bg-[var(--trade-panel)] px-4 py-2 text-sm font-medium text-[var(--trade-text)] shadow-xl transition-all hover:scale-105 hover:bg-[var(--trade-border)]"
        >
          <span>Let&apos;s Chat</span>
          <IconMessageCircle className="size-5" />
        </button>
      </div>
    </div>
  );
}

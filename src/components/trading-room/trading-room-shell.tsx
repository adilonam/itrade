'use client';

import { useCallback, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { TradingRoomShellProvider, useTradingRoomShell } from './trading-room-shell-context';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@/components/ui/resizable';
import { TradingRoomMarketsPanel } from './trading-room-markets-panel';
import { TradingRoomNewsPanel } from './trading-room-news-panel';
import { TradingRoomAdvancedOrderPanel } from './trading-room-advanced-order-panel';
import { cn } from '@/lib/utils';

function TradingRoomShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const isTradeChartRoute =
    pathname === '/trade' || pathname.startsWith('/trading-view-room-trading');

  const {
    symbols,
    selectedSymbolId,
    selectedMarket,
    chartSymbol,
    handleSelectSymbol,
    handleMarketOrder,
    advancedOrderOpen,
    setAdvancedOrderOpen,
    advancedOrderMarket,
    noNavigation,
    symbolLinkBasePath,
    signedIn
  } = useTradingRoomShell();

  const leftPanelInitialSizeRef = useRef<number | null>(null);
  const [leftPanelMinSize, setLeftPanelMinSize] = useState(14);
  const [leftCollapseEnabled, setLeftCollapseEnabled] = useState(false);

  const handleHorizontalLayout = useCallback((sizes: number[]) => {
    if (leftPanelInitialSizeRef.current != null) return;
    const initialLeftSize = sizes[0] ?? 20;
    leftPanelInitialSizeRef.current = initialLeftSize;
    const computedMinSize = Math.max(1, Math.min(100, initialLeftSize * 0.61));
    setLeftPanelMinSize(computedMinSize);
    setLeftCollapseEnabled(true);
  }, []);

  const selectedSymbol = symbols.find((s) => s.id === selectedSymbolId);
  const getName = (item: (typeof symbols)[0]) =>
    'room' in item && typeof (item as { room?: string }).room === 'string'
      ? (item as { name: string }).name
      : (item as { name: string }).name;

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
                key={
                  advancedOrderMarket && 'symbol' in advancedOrderMarket
                    ? advancedOrderMarket.symbol
                    : 'advanced-order'
                }
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
                      symbolLinkBasePath={symbolLinkBasePath}
                    />
                  </ResizablePanel>
                  <ResizableHandle withHandle className="shrink-0 bg-[var(--trade-border)]" />
                  <ResizablePanel defaultSize={48} minSize={22} maxSize={65} className="flex min-h-0 flex-col overflow-hidden">
                    <TradingRoomNewsPanel
                      variant="underMarkets"
                      symbol={chartSymbol}
                      symbolFullName={selectedSymbol ? getName(selectedSymbol) : ''}
                    />
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>
            )}
          </ResizablePanel>
          <ResizableHandle withHandle className="shrink-0 bg-[var(--trade-border)]" />
          <ResizablePanel
            defaultSize={80}
            minSize={50}
            className="flex min-h-0 min-w-0 flex-col overflow-hidden"
          >
            <div
              className={cn(
                'flex min-h-0 min-w-0 flex-1 flex-col',
                isTradeChartRoute ? 'overflow-hidden' : 'overflow-y-auto overflow-x-auto'
              )}
            >
              {children}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}

export function TradingRoomShell({ children }: { children: React.ReactNode }) {
  return (
    <TradingRoomShellProvider>
      <TradingRoomShellInner>{children}</TradingRoomShellInner>
    </TradingRoomShellProvider>
  );
}

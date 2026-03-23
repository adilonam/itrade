'use client';

import { useCallback, useRef, useState } from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@/components/ui/resizable';
import { TradingRoomChart } from './trading-room-chart';
import { TradingRoomPositionsPanel } from './trading-room-positions-panel';
import { useTradingRoomShell } from './trading-room-shell-context';

/** Chart + positions column for `/trade` and `/trading-view-room-trading` (main area next to persistent market/news palette). */
export function TradingRoomTradeMain() {
  const { chartSymbol, headerLastPrice, chartInterval, setChartInterval } =
    useTradingRoomShell();

  const bottomPanelInitialSizeRef = useRef<number | null>(null);
  const [bottomPanelMinSize, setBottomPanelMinSize] = useState(20);
  const [bottomCollapseEnabled, setBottomCollapseEnabled] = useState(false);

  const handleRightVerticalLayout = useCallback((sizes: number[]) => {
    if (bottomPanelInitialSizeRef.current != null) return;
    const initialBottomSize = sizes[1] ?? 0;
    bottomPanelInitialSizeRef.current = initialBottomSize;
    const computedMinSize = Math.max(1, Math.min(100, initialBottomSize * 0.61));
    setBottomPanelMinSize(computedMinSize);
    setBottomCollapseEnabled(true);
  }, []);

  return (
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
  );
}

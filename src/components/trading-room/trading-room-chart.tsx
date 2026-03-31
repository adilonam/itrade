'use client';

import { useState } from 'react';
import { TradingViewRoomTrading } from '@/components/trading-view/trading-view-room-trading';
import { TradingRoomChartHeader, type ChartInterval } from './trading-room-chart-header';

interface TradingRoomChartProps {
  symbol: string;
  interval: ChartInterval;
  lastPrice: number;
}

export function TradingRoomChart({
  symbol,
  interval,
  lastPrice
}: TradingRoomChartProps) {
  const [measureHintOpen, setMeasureHintOpen] = useState(true);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--trade-dark)]">
      <TradingRoomChartHeader
        symbol={symbol}
        lastPrice={lastPrice}
      />
      <div className="relative min-h-0 flex-1">
        <TradingViewRoomTrading
          symbol={symbol}
          interval={interval}
          height="100%"
          width="100%"
        />
        {measureHintOpen ? (
          <div className="absolute right-3 top-3 z-10 flex max-w-[220px] items-start gap-2 rounded border border-[var(--trade-accent-blue)]/40 bg-[var(--trade-panel)]/95 px-2 py-1.5 text-[10px] text-[var(--trade-text)] shadow-lg backdrop-blur-sm">
            <span className="leading-snug">
              Click &amp; drag on chart to measure distance
            </span>
            <button
              type="button"
              onClick={() => setMeasureHintOpen(false)}
              className="shrink-0 text-[var(--trade-text-muted)] hover:text-[var(--trade-text)]"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

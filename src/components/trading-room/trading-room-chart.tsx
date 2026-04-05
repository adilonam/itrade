'use client';

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
      </div>
    </div>
  );
}

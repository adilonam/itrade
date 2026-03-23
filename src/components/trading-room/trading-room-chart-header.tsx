'use client';

import { cn } from '@/lib/utils';

const TIMEFRAMES = [
  { label: '1m', value: '1' },
  { label: '5m', value: '5' },
  { label: '15m', value: '15' },
  { label: 'H1', value: '60' },
  { label: 'D', value: 'D' }
] as const;

export type ChartInterval = (typeof TIMEFRAMES)[number]['value'];

function formatOhlc(n: number, symbol: string) {
  const isJpy = symbol.toUpperCase().includes('JPY');
  const decimals = isJpy ? 3 : symbol.length <= 6 && !symbol.includes('BTC') ? 5 : 2;
  return n.toFixed(decimals);
}

interface TradingRoomChartHeaderProps {
  symbol: string;
  interval: ChartInterval;
  onIntervalChange: (v: ChartInterval) => void;
  lastPrice: number;
}

export function TradingRoomChartHeader({
  symbol,
  interval,
  onIntervalChange,
  lastPrice
}: TradingRoomChartHeaderProps) {
  const spread = symbol.length > 4 ? lastPrice * 0.00015 : 0.00025;
  const c = lastPrice;
  const o = c - spread * 2;
  const h = c + spread * 3;
  const l = c - spread * 4;

  return (
    <div className="flex shrink-0 flex-col gap-2 border-b border-[var(--trade-border)] bg-[var(--trade-panel)] px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 font-mono text-xs text-[var(--trade-text)]">
          <span className="font-bold text-sm">{symbol}</span>
          <span className="ml-2 text-[var(--trade-text-muted)]">
            O {formatOhlc(o, symbol)} H {formatOhlc(h, symbol)} L {formatOhlc(l, symbol)} C{' '}
            {formatOhlc(c, symbol)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              type="button"
              onClick={() => onIntervalChange(tf.value)}
              className={cn(
                'rounded px-2 py-1 text-[10px] font-semibold transition-colors',
                interval === tf.value
                  ? 'bg-[var(--trade-accent-blue)]/20 text-[var(--trade-accent-blue)]'
                  : 'text-[var(--trade-text-muted)] hover:bg-[var(--trade-dark)] hover:text-[var(--trade-text)]'
              )}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

export type ChartInterval = '1' | '5' | '15' | '60' | 'D';

function formatOhlc(n: number, symbol: string) {
  const isJpy = symbol.toUpperCase().includes('JPY');
  const decimals = isJpy ? 3 : symbol.length <= 6 && !symbol.includes('BTC') ? 5 : 2;
  return n.toFixed(decimals);
}

interface TradingRoomChartHeaderProps {
  symbol: string;
  lastPrice: number;
}

export function TradingRoomChartHeader({
  symbol,
  lastPrice
}: TradingRoomChartHeaderProps) {
  const hasSymbol = symbol.trim().length > 0;

  if (!hasSymbol) {
    return (
      <div className="flex shrink-0 flex-col gap-2 border-b border-[var(--trade-border)] bg-[var(--trade-panel)] px-3 py-2">
        <div className="text-xs text-[var(--trade-text-muted)]">—</div>
      </div>
    );
  }

  const spread = symbol.length > 4 ? lastPrice * 0.00015 : 0.00025;
  const c = lastPrice;
  const o = c - spread * 2;
  const h = c + spread * 3;
  const l = c - spread * 4;

  return (
    <div className="flex shrink-0 flex-col gap-2 border-b border-[var(--trade-border)] bg-[var(--trade-panel)] px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 font-mono text-xs text-[var(--trade-text)]">
          <span className="text-[var(--trade-text-muted)]">
            O {formatOhlc(o, symbol)} H {formatOhlc(h, symbol)} L {formatOhlc(l, symbol)} C{' '}
            {formatOhlc(c, symbol)}
          </span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { landingMarketTapeSymbols } from '@/constants/data';

const POLL_MS = 30000;

type TapeQuotes = Record<string, { price: number; percentChange: number }>;

function TapeCell({ symbol, quotes }: { symbol: string; quotes: TapeQuotes }) {
  const row = quotes[symbol];
  const percentChange = row?.percentChange;
  const isUp = typeof percentChange === 'number' ? percentChange >= 0 : true;
  const formattedDelta =
    typeof percentChange === 'number'
      ? `${isUp ? '+' : ''}${percentChange.toFixed(2)}%`
      : '--';
  const formattedPrice =
    typeof row?.price === 'number' ? row.price.toFixed(2) : '--';

  return (
    <div className='flex shrink-0 items-center gap-2 font-mono text-sm whitespace-nowrap'>
      <span className='text-[var(--trade-text)]'>{symbol}</span>
      <span
        className={
          isUp ? 'text-[var(--trade-accent-blue)]' : 'text-[var(--trade-red)]'
        }
      >
        {formattedDelta}
      </span>
      <span className='text-[var(--trade-text-muted)]'>{formattedPrice}</span>
    </div>
  );
}

export function LiveMarketTape() {
  const [quotes, setQuotes] = useState<TapeQuotes>({});

  const symbols = useMemo(() => [...landingMarketTapeSymbols], []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchTape = async () => {
      try {
        const query = new URLSearchParams({ symbols: symbols.join(',') });
        const response = await fetch(`/api/market-tape?${query.toString()}`, {
          cache: 'no-store',
          signal: controller.signal
        });
        if (!response.ok) return;

        const data = (await response.json()) as { quotes?: TapeQuotes };
        if (data.quotes && typeof data.quotes === 'object') {
          setQuotes(data.quotes);
        }
      } catch {
        /* keep last good values */
      }
    };

    void fetchTape();
    const timer = window.setInterval(() => void fetchTape(), POLL_MS);

    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [symbols]);

  const trackClass = 'flex min-w-max shrink-0 items-center gap-8 pr-16';

  return (
    <div
      role='region'
      aria-label='Live market prices'
      className='relative overflow-hidden motion-reduce:overflow-x-auto motion-reduce:overflow-y-hidden'
    >
      <div className='live-market-tape-marquee'>
        <div className={trackClass}>
          {symbols.map((symbol) => (
            <TapeCell key={symbol} symbol={symbol} quotes={quotes} />
          ))}
        </div>
        <div
          className={`${trackClass} motion-reduce:hidden`}
          aria-hidden='true'
        >
          {symbols.map((symbol) => (
            <TapeCell key={`${symbol}-dup`} symbol={symbol} quotes={quotes} />
          ))}
        </div>
      </div>
    </div>
  );
}

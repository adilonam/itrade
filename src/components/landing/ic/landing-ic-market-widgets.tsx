'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { IconCaretUpFilled } from '@tabler/icons-react';
import {
  landingIcWidgetDefaultQuotes,
  landingIcWidgetSymbols,
  type LandingIcWidgetSymbol
} from '@/constants/data';
import {
  formatLandingIcPercentChange,
  formatLandingIcPrice,
  formatLandingIcSpread
} from '@/lib/landing-ic-market-format';

const POLL_MS = 30000;

type WidgetQuote = { bid: number; ask: number; percentChange: number };
type WidgetQuotes = Record<LandingIcWidgetSymbol, WidgetQuote>;

type PairView = {
  symbol: LandingIcWidgetSymbol;
  change: string;
  changeUp: boolean;
  bidPrefix: string;
  bidMain: string;
  bidTail: string;
  askPrefix: string;
  askMain: string;
  askTail: string;
  priceColor: 'green' | 'red';
  spread: string;
};

function toPairView(symbol: LandingIcWidgetSymbol, quote: WidgetQuote): PairView {
  const changeUp = quote.percentChange >= 0;
  const priceColor = changeUp ? 'green' : 'red';
  const bidParts = formatLandingIcPrice(quote.bid, symbol);
  const askParts = formatLandingIcPrice(quote.ask, symbol);

  return {
    symbol,
    change: formatLandingIcPercentChange(quote.percentChange),
    changeUp,
    bidPrefix: bidParts.prefix,
    bidMain: bidParts.main,
    bidTail: bidParts.tail,
    askPrefix: askParts.prefix,
    askMain: askParts.main,
    askTail: askParts.tail,
    priceColor,
    spread: formatLandingIcSpread(symbol, quote.bid, quote.ask)
  };
}

function PriceDigits({
  prefix,
  main,
  tail,
  color
}: {
  prefix: string;
  main: string;
  tail: string;
  color: 'green' | 'red';
}) {
  const accent = color === 'green' ? 'text-[#00ff44]' : 'text-red-500';

  return (
    <div className='flex items-baseline font-mono text-xl leading-none text-white'>
      <span className='text-sm text-slate-300'>{prefix}</span>
      <span className={`mx-0.5 text-3xl font-bold ${accent} price-animate`}>
        {main}
      </span>
      {tail ? (
        <span className={`align-top text-sm ${accent} price-animate`}>{tail}</span>
      ) : null}
    </div>
  );
}

function PairCard({ pair }: { pair: PairView }) {
  const changeColor = pair.changeUp ? 'text-[#00ff44]' : 'text-red-500';

  return (
    <div className='rounded-lg border border-slate-800/80 bg-[#111111] p-3'>
      <div className='mb-2 flex items-center justify-between'>
        <span className='text-xs font-bold tracking-wide text-white'>{pair.symbol}</span>
        <span className={`flex items-center font-mono text-[10px] ${changeColor}`}>
          <IconCaretUpFilled
            className={`mr-1 size-2 fill-current ${pair.changeUp ? '' : 'rotate-180'}`}
          />
          {pair.change}
        </span>
      </div>
      <div className='mb-3 grid grid-cols-2 gap-2'>
        <div>
          <span className='mb-0.5 block text-[10px] text-slate-500'>Bid</span>
          <PriceDigits
            prefix={pair.bidPrefix}
            main={pair.bidMain}
            tail={pair.bidTail}
            color={pair.priceColor}
          />
        </div>
        <div>
          <span className='mb-0.5 block text-[10px] text-slate-500'>Ask</span>
          <PriceDigits
            prefix={pair.askPrefix}
            main={pair.askMain}
            tail={pair.askTail}
            color={pair.priceColor}
          />
        </div>
      </div>
      <div className='flex items-center justify-between gap-2 text-[10px]'>
        <span className='inline-flex h-7 shrink-0 items-center whitespace-nowrap rounded border border-slate-700 bg-slate-800 px-2 leading-none text-slate-300'>
          Spread <span className='ml-1 font-bold text-white'>{pair.spread}</span>
        </span>
        <div className='flex shrink-0 space-x-1'>
          <button
            type='button'
            className='inline-flex h-7 items-center rounded border border-[#00ff44]/50 bg-[#00ff44]/20 px-3 font-bold text-[#00ff44] transition hover:bg-[#00ff44] hover:text-black'
          >
            BUY
          </button>
          <button
            type='button'
            className='inline-flex h-7 items-center rounded border border-red-500/50 bg-red-500/20 px-3 font-bold text-red-500 transition hover:bg-red-500 hover:text-white'
          >
            SELL
          </button>
        </div>
      </div>
    </div>
  );
}

export function LandingIcMarketWidgets() {
  const [quotes, setQuotes] = useState<WidgetQuotes>(landingIcWidgetDefaultQuotes);
  const [loading, setLoading] = useState(true);
  const prevQuotesRef = useRef<WidgetQuotes>(landingIcWidgetDefaultQuotes);

  const pairs = useMemo(
    () =>
      landingIcWidgetSymbols.map(({ display }) =>
        toPairView(display, quotes[display] ?? landingIcWidgetDefaultQuotes[display])
      ),
    [quotes]
  );

  useEffect(() => {
    const controller = new AbortController();

    const fetchQuotes = async () => {
      try {
        const response = await fetch('/api/landing-market-quotes', {
          cache: 'no-store',
          signal: controller.signal
        });
        if (!response.ok) return;

        const data = (await response.json()) as { quotes?: WidgetQuotes };
        if (data.quotes && typeof data.quotes === 'object') {
          setQuotes((prev) => ({ ...prev, ...data.quotes }));
        }
      } catch {
        /* keep last good values */
      } finally {
        setLoading(false);
      }
    };

    void fetchQuotes();
    const timer = window.setInterval(() => void fetchQuotes(), POLL_MS);

    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const prev = prevQuotesRef.current;
    const changed = landingIcWidgetSymbols.some(
      ({ display }) =>
        quotes[display]?.bid !== prev[display]?.bid ||
        quotes[display]?.ask !== prev[display]?.ask
    );

    if (!changed) return;

    prevQuotesRef.current = quotes;
    const els = document.querySelectorAll<HTMLElement>('.price-animate');
    els.forEach((el) => {
      el.style.opacity = '0.5';
      window.setTimeout(() => {
        el.style.opacity = '1';
      }, 100);
    });
  }, [quotes]);

  return (
    <div
      className='landing-ic-market-widget-bg relative grid grid-cols-2 gap-4 rounded-xl border border-slate-800 p-5 shadow-2xl'
      aria-busy={loading}
    >
      <div className='pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-white/5 to-transparent' />
      {pairs.map((pair) => (
        <PairCard key={pair.symbol} pair={pair} />
      ))}
    </div>
  );
}

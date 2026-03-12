'use client';

import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TradingRoomOrderPanel } from './trading-room-order-panel';
import type { Market } from '@/lib/prisma/generated/client';
import type { MockSymbol } from './mock-data';
import { IconSearch, IconStar, IconTrendingUp } from '@tabler/icons-react';
import Link from 'next/link';

export type SymbolItem = Market | MockSymbol;

function isMarket(item: SymbolItem): item is Market {
  return 'room' in item && typeof (item as Market).room === 'string';
}

interface TradingRoomSidebarProps {
  symbols: SymbolItem[];
  selectedSymbolId: string | null;
  selectedMarket: Market | null;
  onSelectSymbol: (id: string, market: Market | null) => void;
  onMarketOrder?: (type: 'BUY' | 'SELL', quantity: number) => void;
  guestMode?: boolean;
  /** When true, symbol clicks update chart in-place without URL navigation */
  noNavigation?: boolean;
}

export function TradingRoomSidebar({
  symbols,
  selectedSymbolId,
  selectedMarket,
  onSelectSymbol,
  onMarketOrder,
  guestMode = false,
  noNavigation = false
}: TradingRoomSidebarProps) {
  const [listTab, setListTab] = useState<'favorites' | 'movers'>('movers');

  const getPrice = (item: SymbolItem) =>
    isMarket(item) ? item.lastPrice : (item as MockSymbol).price;
  const getDailyChange = (item: SymbolItem) =>
    isMarket(item)
      ? (item as Market & { lastChange?: number }).lastChange ?? 0
      : (item as MockSymbol).dailyChange;
  const getSymbol = (item: SymbolItem) => item.symbol;
  const getName = (item: SymbolItem) =>
    isMarket(item) ? (item as Market).name : (item as MockSymbol).name;
  const getId = (item: SymbolItem) => item.id;

  const rowContent = (item: SymbolItem, isSelected: boolean) => {
    const id = getId(item);
    const price = getPrice(item);
    const symbol = getSymbol(item);
    const name = getName(item);
    const market = isMarket(item) ? item : null;
    const rowBase =
      'flex w-full items-center justify-between border-b border-[var(--trade-border)] px-3 py-2.5 text-left text-sm transition-colors hover:bg-[var(--trade-dark)]/30 ' +
      (isSelected
        ? 'bg-[var(--trade-accent-blue)]/15 border-l-2 border-l-[var(--trade-accent-blue)]'
        : 'border-l-2 border-l-transparent');

    const inner = (
      <>
        <div>
          <div className="font-bold">{symbol}</div>
          <div className="text-[10px] text-[var(--trade-text-muted)]">{name}</div>
        </div>
        <div className="flex flex-col items-end">
          <span className="font-mono text-sm">
            {price >= 1 ? price.toFixed(5) : price.toFixed(3)}
          </span>
        </div>
      </>
    );

    if (noNavigation) {
      return (
        <button key={id} type="button" onClick={() => onSelectSymbol(id, market)} className={rowBase}>
          {inner}
        </button>
      );
    }
    return (
      <Link
        key={id}
        href={`/trading-view-room-trading?pk=${encodeURIComponent(id)}`}
        onClick={(e) => {
          e.preventDefault();
          onSelectSymbol(id, market);
        }}
        className={rowBase}
      >
        {inner}
      </Link>
    );
  };

  return (
    <div className="flex h-full w-full flex-col">
      {/* Search and Favorites/Top Movers */}
      <div className="shrink-0 border-b border-[var(--trade-border)] p-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setListTab('favorites')}
              className={`flex items-center gap-1 border-b-2 px-0 py-1 text-xs ${
                listTab === 'favorites'
                  ? 'border-[var(--trade-accent-blue)] font-bold text-white'
                  : 'border-transparent text-[var(--trade-text-muted)] hover:text-white'
              }`}
            >
              <IconStar className="size-3" />
              Favorites
            </button>
            <button
              type="button"
              onClick={() => setListTab('movers')}
              className={`flex items-center gap-1 border-b-2 px-0 py-1 text-xs ${
                listTab === 'movers'
                  ? 'border-[var(--trade-accent-blue)] font-bold text-white'
                  : 'border-transparent text-[var(--trade-text-muted)] hover:text-white'
              }`}
            >
              <IconTrendingUp className="size-3" />
              Top Movers
            </button>
          </div>
          <button type="button" className="text-[var(--trade-text-muted)] hover:text-white" aria-label="Search">
            <IconSearch className="size-4" />
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search symbols"
            className="w-full rounded border border-[var(--trade-border)] bg-[var(--trade-dark)] px-3 py-1.5 text-sm text-white placeholder:text-[var(--trade-text-muted)] focus:border-[var(--trade-accent-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--trade-accent-blue)]"
          />
        </div>
      </div>

      {/* Popular section + symbols list */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--trade-border)] bg-[var(--trade-dark)]/40 px-3 py-2">
          <div className="flex items-center gap-2">
            <IconTrendingUp className="size-4 text-[var(--trade-accent-blue)]" />
            <span className="text-xs font-bold uppercase tracking-wider">Popular</span>
            <span className="rounded bg-[var(--trade-border)] px-1.5 py-0.5 text-[10px]">{symbols.length}</span>
          </div>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-0">
            {symbols.map((item) => {
              const id = getId(item);
              const isSelected = selectedSymbolId === id;
              return <div key={id}>{rowContent(item, isSelected)}</div>;
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Order panel - expanded for selected symbol */}
      <div className="shrink-0 border-t border-[var(--trade-border)] p-3">
        <TradingRoomOrderPanel
          market={selectedMarket}
          onMarketOrder={onMarketOrder}
          disabled={guestMode}
        />
      </div>

      {/* Bottom: News/Calendar icons (minimal) */}
      <div className="flex shrink-0 justify-between border-t border-[var(--trade-border)] bg-[var(--trade-dark)]/30 p-2 text-[var(--trade-text-muted)]">
        <div className="flex gap-4">
          <button type="button" className="hover:text-white">News</button>
          <button type="button" className="hover:text-white">Calendar</button>
        </div>
      </div>
    </div>
  );
}

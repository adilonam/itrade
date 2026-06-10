'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TradingRoomOrderPanel } from './trading-room-order-panel';
import type { Market } from '@/lib/prisma/generated/client';
import type { MockSymbol } from './mock-data';
import { getCurrencyFlags } from '@/lib/currency-flags';
import {
  IconStar,
  IconTrendingUp,
  IconInfoCircle,
  IconSettings
} from '@tabler/icons-react';

export type SymbolItem = Market | MockSymbol;

function isMarket(item: SymbolItem): item is Market {
  return 'room' in item && typeof (item as Market).room === 'string';
}

interface TradingRoomMarketsPanelProps {
  symbols: SymbolItem[];
  selectedSymbolId: string | null;
  selectedMarket: Market | null;
  onSelectSymbol: (id: string, market: Market | null) => void;
  onMarketOrder?: (
    type: 'BUY' | 'SELL',
    quantity: number
  ) => Promise<void> | void;
  onAdvancedOrderClick?: () => void;
  /** When true, buy/sell controls are inactive (e.g. user not signed in). */
  tradingDisabled?: boolean;
  /** When true, symbol clicks update chart in-place without URL navigation */
  noNavigation?: boolean;
  /** Base path for symbol deep links (e.g. `/trading-view-room-trading`). */
  symbolLinkBasePath?: string;
  /** When false, hides quick buy/sell (e.g. institutional room for non-admin users). */
  showOrderControls?: boolean;
  /** Narrow layout for small screens (chart + buy/sell only). */
  compact?: boolean;
}

/** Symbol list + buy/sell (order) for the selected instrument */
export function TradingRoomMarketsPanel({
  symbols,
  selectedSymbolId,
  selectedMarket: _selectedMarket,
  onSelectSymbol,
  onMarketOrder,
  onAdvancedOrderClick,
  tradingDisabled = false,
  noNavigation = false,
  symbolLinkBasePath = '/trading-view-room-trading',
  showOrderControls = true,
  compact = false
}: TradingRoomMarketsPanelProps) {
  void _selectedMarket; // Reserved for future use
  const t = useTranslations('Trade.markets');
  const [symbolQuery, setSymbolQuery] = useState('');

  const getPrice = (item: SymbolItem) =>
    isMarket(item) ? item.lastPrice : (item as MockSymbol).price;
  const getSymbol = (item: SymbolItem) => item.symbol;
  const getName = (item: SymbolItem) =>
    isMarket(item) ? (item as Market).name : (item as MockSymbol).name;
  const getId = (item: SymbolItem) => item.id;
  const normalize = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]/g, '');
  const query = normalize(symbolQuery.trim());
  const filteredSymbols =
    query.length === 0
      ? symbols
      : symbols.filter((item) => {
          const symbol = normalize(getSymbol(item));
          const name = normalize(getName(item));
          return symbol.includes(query) || name.includes(query);
        });

  const formatPrice = (price: number) => {
    const s = price >= 1 ? price.toFixed(5) : price.toFixed(3);
    return s.replace(/\.?0+$/, '');
  };

  const rowContent = (item: SymbolItem, isSelected: boolean) => {
    const id = getId(item);
    const price = getPrice(item);
    const symbol = getSymbol(item);
    const name = getName(item);
    const market = isMarket(item) ? item : null;
    const [flagBase, flagQuote] = getCurrencyFlags(symbol);
    const handleClick = () => onSelectSymbol(id, market);
    const isPair = flagQuote.length > 0;

    if (isSelected) {
      return (
        <div
          key={id}
          className="border-b border-[var(--trade-border)] bg-[var(--trade-dark)]/20"
          data-purpose="asset-item-active"
        >
          <div className={compact ? 'p-2' : 'p-3'}>
            <div className={`flex items-start justify-between ${compact ? 'mb-1.5' : 'mb-2'}`}>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                  <span
                    className={`flex size-4 items-center justify-center rounded-full border border-[var(--trade-border)] bg-[var(--trade-panel)] ${isPair ? 'text-[8px]' : 'text-[10px] font-bold'}`}
                  >
                    {flagBase}
                  </span>
                  {isPair && (
                    <span className="flex size-4 items-center justify-center rounded-full border border-[var(--trade-border)] bg-[var(--trade-panel)] text-[8px]">
                      {flagQuote}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold">{symbol}</div>
                  <div className="text-[10px] text-[var(--trade-text-muted)]">{name}</div>
                </div>
              </div>
              <div className="text-sm font-mono font-bold">{formatPrice(price)}</div>
            </div>
            {showOrderControls ? (
              <>
                <TradingRoomOrderPanel
                  market={market ?? { symbol, lastPrice: price, spread: 0.00002 }}
                  onMarketOrder={onMarketOrder}
                  disabled={tradingDisabled}
                  showAdvancedOrder={false}
                />
                <div
                  className={`flex items-center justify-between px-1 text-[10px] text-[var(--trade-text-muted)] ${compact ? 'mt-2' : 'mt-3'}`}
                >
                  <button
                    type="button"
                    onClick={() => onAdvancedOrderClick?.()}
                    className="flex items-center gap-1 hover:text-[var(--trade-text)]"
                  >
                    <IconSettings className="size-3" />
                    {t('advancedOrder')}
                  </button>
                  <div className="flex gap-2">
                    <button type="button" className="hover:text-[var(--trade-text)]" aria-label={t('info')}>
                      <IconInfoCircle className="size-3" />
                    </button>
                    <button type="button" className="hover:text-[var(--trade-text)]" aria-label={t('favorite')}>
                      <IconStar className="size-3" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-[10px] leading-snug text-[var(--trade-text-muted)]">
                {t('institutionalOrdersNote')}
              </p>
            )}
          </div>
        </div>
      );
    }

    const rowBase =
      'flex w-full items-center justify-between border-b border-[var(--trade-border)] px-3 py-2.5 text-left text-sm transition-colors hover:bg-[var(--trade-dark)]/30 cursor-pointer border-l-2 border-l-transparent';

    const inner = (
      <>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1">
            <span
              className={`flex size-4 items-center justify-center rounded-full border border-[var(--trade-border)] bg-[var(--trade-panel)] ${isPair ? 'text-[8px]' : 'text-[10px] font-bold'}`}
            >
              {flagBase}
            </span>
            {isPair && (
              <span className="flex size-4 items-center justify-center rounded-full border border-[var(--trade-border)] bg-[var(--trade-panel)] text-[8px]">
                {flagQuote}
              </span>
            )}
          </div>
          <div>
            <div className="text-sm font-bold">{symbol}</div>
            <div className="text-[10px] text-[var(--trade-text-muted)]">{name}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-mono text-sm">{formatPrice(price)}</span>
          <IconStar className="size-3 text-[var(--trade-text-muted)]" />
        </div>
      </>
    );

    if (noNavigation) {
      return (
        <button key={id} type="button" onClick={handleClick} className={rowBase}>
          {inner}
        </button>
      );
    }
    return (
      <Link
        key={id}
        href={`${symbolLinkBasePath}?pk=${encodeURIComponent(id)}`}
        onClick={(e) => {
          e.preventDefault();
          handleClick();
        }}
        className={rowBase}
      >
        {inner}
      </Link>
    );
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div
        className={`shrink-0 border-b border-[var(--trade-border)] ${compact ? 'p-2' : 'p-3'}`}
      >
        <input
          type="text"
          placeholder="Symbol"
          value={symbolQuery}
          onChange={(e) => setSymbolQuery(e.target.value)}
          className="w-full rounded border border-[var(--trade-border)] bg-[var(--trade-dark)] px-3 py-1.5 text-sm text-[var(--trade-text)] placeholder:text-[var(--trade-text-muted)] focus:border-[var(--trade-accent-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--trade-accent-blue)]"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--trade-border)] bg-[var(--trade-dark)]/40 px-3 py-2">
          <div className="flex items-center gap-2">
            <IconTrendingUp className="size-4 text-[var(--trade-accent-blue)]" />
            <span className="text-xs font-bold uppercase tracking-wider">Popular</span>
            <span className="rounded bg-[var(--trade-border)] px-1.5 py-0.5 text-[10px]">{symbols.length}</span>
          </div>
        </div>
        <ScrollArea className={compact ? 'min-h-0 max-h-[28vh] flex-1' : 'min-h-0 flex-1'}>
          <div className="space-y-0">
            {filteredSymbols.map((item) => {
              const id = getId(item);
              const isSelected = selectedSymbolId === id;
              return <div key={id}>{rowContent(item, isSelected)}</div>;
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

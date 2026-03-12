'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TradingRoomOrderPanel } from './trading-room-order-panel';
import { MOCK_NEWS } from './mock-data';
import type { Market } from '@/lib/prisma/generated/client';
import type { MockSymbol } from './mock-data';
import { IconSearch } from '@tabler/icons-react';
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
  const [listTab, setListTab] = useState<'favorites' | 'movers'>('favorites');
  const [newsTab, setNewsTab] = useState<'news' | 'calendar' | 'market' | 'symbol'>('news');

  const getPrice = (item: SymbolItem) =>
    isMarket(item) ? item.lastPrice : (item as MockSymbol).price;
  const getDailyChange = (item: SymbolItem) =>
    isMarket(item)
      ? (item as Market & { lastChange?: number }).lastChange ?? 0
      : (item as MockSymbol).dailyChange;
  const getSymbol = (item: SymbolItem) => item.symbol;
  const getId = (item: SymbolItem) => item.id;

  return (
    <div className='flex h-full w-full flex-col border-r border-border bg-background'>
      <Tabs value={listTab} onValueChange={(v) => setListTab(v as 'favorites' | 'movers')}>
        <div className='flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2'>
          <TabsList className='h-8 gap-1 rounded-full bg-muted/50 p-1'>
            <TabsTrigger
              value='favorites'
              className='rounded-full border-0 px-3 transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm'
            >
              Favorites
            </TabsTrigger>
            <TabsTrigger
              value='movers'
              className='rounded-full border-0 px-3 transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm'
            >
              Top Movers
            </TabsTrigger>
          </TabsList>
          <button
            type='button'
            className='rounded-lg p-1.5 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground'
            aria-label='Search'
          >
            <IconSearch className='size-4' />
          </button>
        </div>
        <TabsContent value='favorites' className='mt-0 flex-1 overflow-hidden'>
          <ScrollArea className='h-[220px]'>
            <div className='space-y-0'>
              {symbols.map((item) => {
                const id = getId(item);
                const price = getPrice(item);
                const daily = getDailyChange(item);
                const symbol = getSymbol(item);
                const isSelected = selectedSymbolId === id;
                const market = isMarket(item) ? item : null;
                const rowClassName = `flex w-full items-center justify-between border-b border-border/50 px-3 py-2 text-sm transition-colors hover:bg-muted/50 text-left ${
                  isSelected ? 'bg-muted' : ''
                }`;
                return noNavigation ? (
                  <button
                    key={id}
                    type='button'
                    onClick={() => onSelectSymbol(id, market)}
                    className={rowClassName}
                  >
                    <span className='font-medium'>{symbol}</span>
                    <div className='flex items-center gap-2'>
                      <span className='text-muted-foreground'>
                        {price >= 1 ? price.toFixed(5) : price.toFixed(3)}
                      </span>
                      <span
                        className={
                          daily >= 0 ? 'text-emerald-500' : 'text-red-500'
                        }
                      >
                        {daily >= 0 ? '+' : ''}
                        {daily.toFixed(2)}%
                      </span>
                    </div>
                  </button>
                ) : (
                  <Link
                    key={id}
                    href={`/trading-view-room-trading?pk=${encodeURIComponent(id)}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectSymbol(id, market);
                    }}
                    className={rowClassName}
                  >
                    <span className='font-medium'>{symbol}</span>
                    <div className='flex items-center gap-2'>
                      <span className='text-muted-foreground'>
                        {price >= 1 ? price.toFixed(5) : price.toFixed(3)}
                      </span>
                      <span
                        className={
                          daily >= 0 ? 'text-emerald-500' : 'text-red-500'
                        }
                      >
                        {daily >= 0 ? '+' : ''}
                        {daily.toFixed(2)}%
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value='movers' className='mt-0 flex-1 overflow-hidden'>
          <ScrollArea className='h-[220px]'>
            <div className='space-y-0'>
              {symbols.map((item) => {
                const id = getId(item);
                const price = getPrice(item);
                const daily = getDailyChange(item);
                const symbol = getSymbol(item);
                const isSelected = selectedSymbolId === id;
                const market = isMarket(item) ? item : null;
                return (
                  <button
                    key={id}
                    type='button'
                    onClick={() => onSelectSymbol(id, market)}
                    className={`flex w-full items-center justify-between border-b border-border/50 px-3 py-2 text-sm transition-colors hover:bg-muted/50 ${
                      isSelected ? 'bg-muted' : ''
                    }`}
                  >
                    <span className='font-medium'>{symbol}</span>
                    <div className='flex items-center gap-2'>
                      <span className='text-muted-foreground'>
                        {price >= 1 ? price.toFixed(5) : price.toFixed(3)}
                      </span>
                      <span
                        className={
                          daily >= 0 ? 'text-emerald-500' : 'text-red-500'
                        }
                      >
                        {daily >= 0 ? '+' : ''}
                        {daily.toFixed(2)}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div className='shrink-0 border-t border-border p-3'>
        <TradingRoomOrderPanel
          market={selectedMarket}
          onMarketOrder={onMarketOrder}
          disabled={guestMode}
        />
      </div>

      <div className='flex min-h-0 flex-1 flex-col border-t border-border'>
        <Tabs
          value={newsTab}
          onValueChange={(v) =>
            setNewsTab(v as 'news' | 'calendar' | 'market' | 'symbol')
          }
        >
          <div className='flex shrink-0 border-b border-border px-2 py-1'>
            <TabsList className='h-8 gap-1 rounded-full bg-muted/50 p-1'>
              <TabsTrigger
                value='news'
                className='rounded-full border-0 px-2.5 text-sm transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm'
              >
                News
              </TabsTrigger>
              <TabsTrigger
                value='calendar'
                className='rounded-full border-0 px-2.5 text-sm transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm'
              >
                Calendar
              </TabsTrigger>
              <TabsTrigger
                value='market'
                className='rounded-full border-0 px-2.5 text-sm transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm'
              >
                Market
              </TabsTrigger>
              <TabsTrigger
                value='symbol'
                className='rounded-full border-0 px-2.5 text-sm transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm'
              >
                Symbol
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value='news' className='mt-0 flex-1 overflow-hidden'>
            <ScrollArea className='h-full min-h-[180px]'>
              <ul className='space-y-2 p-2'>
                {MOCK_NEWS.map((item) => (
                  <li
                    key={item.id}
                    className='text-muted-foreground cursor-pointer text-xs leading-snug hover:text-foreground'
                  >
                    <span className='text-muted-foreground/70 mr-2'>
                      {item.time}
                    </span>
                    {item.title}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </TabsContent>
          <TabsContent value='calendar' className='mt-0'>
            <div className='text-muted-foreground p-4 text-center text-sm'>
              No calendar events
            </div>
          </TabsContent>
          <TabsContent value='market' className='mt-0'>
            <div className='text-muted-foreground p-4 text-center text-sm'>
              Market overview
            </div>
          </TabsContent>
          <TabsContent value='symbol' className='mt-0'>
            <div className='text-muted-foreground p-4 text-center text-sm'>
              Symbol info
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { IconMinus, IconPlus } from '@tabler/icons-react';
import type { Market } from '@/lib/prisma/generated/client';
import { useMarketsWebSocket } from '@/contexts/markets-websocket-context';

interface TradingRoomOrderPanelProps {
  market: Market | null;
  onMarketOrder?: (type: 'BUY' | 'SELL', quantity: number) => void;
  disabled?: boolean;
}

export function TradingRoomOrderPanel({
  market,
  onMarketOrder,
  disabled = false
}: TradingRoomOrderPanelProps) {
  const [lotSize, setLotSize] = useState('0.01');
  const { realTimePrices, isConnected, subscribe } = useMarketsWebSocket();

  // Subscribe to live price for selected market
  useEffect(() => {
    if (market?.symbol && isConnected) {
      subscribe([market.symbol]);
    }
  }, [market?.symbol, isConnected, subscribe]);

  const livePrice = market?.symbol
    ? realTimePrices.get(market.symbol)?.price
    : undefined;
  const midPrice = livePrice ?? market?.lastPrice ?? 0;
  const spread = market?.spread ?? 0;
  const bid = midPrice - spread / 2;
  const ask = midPrice + spread / 2;

  const formatFull = (p: number) => (p >= 1 ? p.toFixed(5) : p.toFixed(3));
  const formatCompact = (p: number) => (p >= 1 ? p.toFixed(2) : p.toFixed(3));
  const displayBidFull = formatFull(bid);
  const displayBidCompact = formatCompact(bid);
  const displayAskFull = formatFull(ask);
  const displayAskCompact = formatCompact(ask);

  const price = midPrice;

  const incrementLot = () => {
    const n = parseFloat(lotSize) || 0;
    setLotSize(Math.min(100, n + 0.01).toFixed(2));
  };
  const decrementLot = () => {
    const n = parseFloat(lotSize) || 0;
    setLotSize(Math.max(0.01, n - 0.01).toFixed(2));
  };

  if (!market) {
    return (
      <div className='rounded-lg border border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground'>
        Select a symbol to trade
      </div>
    );
  }

  const marginEstimate = (parseFloat(lotSize) || 0) * price * 100000 * 0.01; // rough forex margin

  return (
    <div className='space-y-2 rounded-xl border border-border bg-card p-3'>
      <Button
        variant='destructive'
        className='h-12 w-full min-w-0 rounded-xl text-sm font-semibold transition-all duration-200 ease-out hover:brightness-110 hover:shadow-md active:scale-[0.98] sm:text-base'
        disabled={disabled}
        onClick={() =>
          onMarketOrder?.('SELL', parseFloat(lotSize) || 0.01)
        }
        title={`SELL at ${displayBidFull} (bid)`}
      >
        <span className='min-w-0 truncate'>
          SELL {displayBidCompact}
        </span>
      </Button>
      <div className='flex items-center gap-2'>
        <Button
          type='button'
          variant='outline'
          size='icon'
          className='h-8 w-8 shrink-0 rounded-lg transition-all duration-200 ease-out hover:bg-muted active:scale-95'
          onClick={decrementLot}
          disabled={disabled}
        >
          <IconMinus className='size-4' />
        </Button>
        <Input
          type='number'
          min={0.01}
          step={0.01}
          value={lotSize}
          onChange={(e) => setLotSize(e.target.value)}
          className='h-8 flex-1 rounded-lg text-center text-sm transition-colors duration-200'
          disabled={disabled}
        />
        <Button
          type='button'
          variant='outline'
          size='icon'
          className='h-8 w-8 shrink-0 rounded-lg transition-all duration-200 ease-out hover:bg-muted active:scale-95'
          onClick={incrementLot}
          disabled={disabled}
        >
          <IconPlus className='size-4' />
        </Button>
      </div>
      <p className='text-muted-foreground text-center text-xs'>
        {marginEstimate.toFixed(0)} USD
      </p>
      <Button
        className='h-12 w-full min-w-0 rounded-xl bg-emerald-600 text-sm font-semibold transition-all duration-200 ease-out hover:bg-emerald-500 hover:shadow-md active:scale-[0.98] disabled:opacity-50 sm:text-base'
        disabled={disabled}
        onClick={() =>
          onMarketOrder?.('BUY', parseFloat(lotSize) || 0.01)
        }
        title={`BUY at ${displayAskFull} (ask)`}
      >
        <span className='min-w-0 truncate'>
          BUY {displayAskCompact}
        </span>
      </Button>
      <Link
        href='#'
        className='text-primary block text-center text-xs transition-opacity duration-200 hover:underline hover:opacity-90'
      >
        Advanced Order
      </Link>
    </div>
  );
}

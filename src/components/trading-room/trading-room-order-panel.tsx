'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { IconMinus, IconPlus } from '@tabler/icons-react';
import type { Market } from '@/lib/prisma/generated/client';

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
  const price = market?.lastPrice ?? 0;
  const displayPrice = price >= 1 ? price.toFixed(5) : price.toFixed(3);

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
        className='h-12 w-full rounded-xl text-base font-semibold transition-all duration-200 ease-out hover:brightness-110 hover:shadow-md active:scale-[0.98]'
        disabled={disabled}
        onClick={() =>
          onMarketOrder?.('SELL', parseFloat(lotSize) || 0.01)
        }
      >
        SELL {displayPrice}
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
        className='h-12 w-full rounded-xl bg-emerald-600 text-base font-semibold transition-all duration-200 ease-out hover:bg-emerald-500 hover:shadow-md active:scale-[0.98] disabled:opacity-50'
        disabled={disabled}
        onClick={() =>
          onMarketOrder?.('BUY', parseFloat(lotSize) || 0.01)
        }
      >
        BUY {displayPrice}
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

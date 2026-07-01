'use client';

import { useState } from 'react';
import { IconArrowDown, IconArrowUp } from '@tabler/icons-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  calculateWinAmount,
  formatCents,
  quickBetAmounts,
  type PricePredictionMarket
} from '@/lib/price-prediction/mock-data';
import { cn } from '@/lib/utils';

type BettingPanelProps = {
  market: PricePredictionMarket;
};

type Side = 'up' | 'down';

export function BettingPanel({ market }: BettingPanelProps) {
  const [side, setSide] = useState<Side>('up');
  const [mode, setMode] = useState<'buy' | 'sell'>('buy');

  const contractPrice = side === 'up' ? market.upPrice : market.downPrice;

  return (
    <div className='rounded-xl border border-trade-border bg-trade-panel p-4'>
      <Tabs
        value={mode}
        onValueChange={(v) => setMode(v as 'buy' | 'sell')}
        className='mb-4'
      >
        <TabsList className='grid h-auto w-full grid-cols-2 rounded-lg bg-trade-dark p-1'>
          <TabsTrigger
            value='buy'
            className={cn(
              'rounded-md py-2 text-sm font-medium',
              'data-[state=active]:bg-trade-panel data-[state=active]:text-trade-text',
              'text-trade-text-muted'
            )}
          >
            Buy
          </TabsTrigger>
          <TabsTrigger
            value='sell'
            className={cn(
              'rounded-md py-2 text-sm font-medium',
              'data-[state=active]:bg-trade-panel data-[state=active]:text-trade-text',
              'text-trade-text-muted'
            )}
          >
            Sell
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className='mb-4 grid grid-cols-2 gap-2'>
        <button
          type='button'
          onClick={() => setSide('up')}
          className={cn(
            'flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition',
            side === 'up'
              ? 'bg-trade-green text-trade-dark'
              : 'bg-trade-green/15 text-trade-green hover:bg-trade-green/25'
          )}
        >
          <IconArrowUp className='size-4' />
          Up {formatCents(market.upPrice)}
        </button>
        <button
          type='button'
          onClick={() => setSide('down')}
          className={cn(
            'flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition',
            side === 'down'
              ? 'bg-trade-red text-white'
              : 'bg-trade-red/15 text-trade-red hover:bg-trade-red/25'
          )}
        >
          <IconArrowDown className='size-4' />
          Down {formatCents(market.downPrice)}
        </button>
      </div>

      <p className='mb-3 text-xs text-trade-text-muted'>
        {mode === 'buy' ? 'One-tap buy' : 'One-tap sell'} —{' '}
        <span className={side === 'up' ? 'text-trade-green' : 'text-trade-red'}>
          {side === 'up' ? 'Up' : 'Down'}
        </span>
      </p>

      <div className='space-y-2'>
        {quickBetAmounts.map((amount) => {
          const winAmount = calculateWinAmount(amount, contractPrice);
          return (
            <button
              key={amount}
              type='button'
              className='flex w-full items-center justify-between rounded-lg border border-trade-border bg-trade-dark px-4 py-3 text-left transition hover:border-trade-accent-blue/50 hover:bg-trade-dark/80'
            >
              <span className='text-sm font-semibold text-trade-text'>
                ${amount}
              </span>
              <span className='text-xs text-trade-text-muted'>
                Win{' '}
                <span className='font-medium text-trade-green'>
                  ${winAmount.toFixed(2)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { IconLivePhoto } from '@tabler/icons-react';
import {
  formatCents,
  type PricePredictionMarket
} from '@/lib/price-prediction/mock-data';
import { pricePredictionLinks } from '@/constants/data';
import { UpDownGauge } from './up-down-gauge';
import { cn } from '@/lib/utils';

type MarketCardProps = {
  market: PricePredictionMarket;
};

export function MarketCard({ market }: MarketCardProps) {
  return (
    <Link
      href={pricePredictionLinks.market(market.slug)}
      className='group flex flex-col rounded-xl border border-trade-border bg-trade-panel p-4 transition hover:border-trade-accent-blue/50 hover:bg-trade-panel/80'
    >
      <div className='mb-3 flex items-start justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <div
            className='flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white'
            style={{ backgroundColor: market.iconColor }}
          >
            {market.symbol.slice(0, 1)}
          </div>
          <div>
            <h3 className='text-sm font-semibold text-trade-text group-hover:text-white'>
              {market.title}
            </h3>
            <p className='text-xs text-trade-text-muted'>{market.name}</p>
          </div>
        </div>
        {market.isLive && (
          <span className='inline-flex items-center gap-1 rounded-full bg-trade-red/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-trade-red'>
            <IconLivePhoto className='size-3' />
            Live
          </span>
        )}
      </div>

      <div className='mb-4 flex items-center justify-between'>
        <UpDownGauge upPercent={market.upPercent} size='sm' />
        <div className='text-right'>
          <p className='text-xs text-trade-text-muted'>Volume</p>
          <p className='text-sm font-medium text-trade-text'>{market.volume}</p>
        </div>
      </div>

      <div className='mt-auto grid grid-cols-2 gap-2'>
        <button
          type='button'
          className={cn(
            'rounded-lg bg-trade-green/15 py-2 text-center text-sm font-semibold text-trade-green',
            'transition group-hover:bg-trade-green/25'
          )}
          onClick={(e) => e.preventDefault()}
        >
          Up {formatCents(market.upPrice)}
        </button>
        <button
          type='button'
          className={cn(
            'rounded-lg bg-trade-red/15 py-2 text-center text-sm font-semibold text-trade-red',
            'transition group-hover:bg-trade-red/25'
          )}
          onClick={(e) => e.preventDefault()}
        >
          Down {formatCents(market.downPrice)}
        </button>
      </div>
    </Link>
  );
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { IconArrowLeft, IconLivePhoto } from '@tabler/icons-react';
import {
  formatUsd,
  generateTimeSlots,
  type PricePredictionMarket,
  type PricePredictionTimeSlot
} from '@/lib/price-prediction/mock-data';
import { pricePredictionLinks } from '@/constants/data';
import { CountdownTimer } from './countdown-timer';
import { PriceChart } from './price-chart';
import { TimeSlotPicker } from './time-slot-picker';
import { BettingPanel } from './betting-panel';
import { RelatedMarkets } from './related-markets';
import { OrderBook } from './order-book';
import { MarketRules } from './market-rules';

type MarketDetailViewProps = {
  market: PricePredictionMarket;
  allMarkets: PricePredictionMarket[];
};

export function MarketDetailView({ market, allMarkets }: MarketDetailViewProps) {
  const initialSlots = useMemo(() => generateTimeSlots(), []);
  const [activeSlot, setActiveSlot] = useState<PricePredictionTimeSlot>(
    () => initialSlots.find((s) => s.isActive) ?? initialSlots[0]!
  );

  const priceDiff = market.currentPrice - market.priceToBeat;
  const isAboveBeat = priceDiff >= 0;

  return (
    <div className='space-y-6'>
      <Link
        href={pricePredictionLinks.listing}
        className='inline-flex items-center gap-1 text-sm text-trade-text-muted transition hover:text-trade-text'
      >
        <IconArrowLeft className='size-4' />
        All markets
      </Link>

      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <div
            className='flex size-12 items-center justify-center rounded-full text-lg font-bold text-white'
            style={{ backgroundColor: market.iconColor }}
          >
            {market.symbol.slice(0, 1)}
          </div>
          <div>
            <div className='flex items-center gap-2'>
              <h1 className='text-xl font-bold text-trade-text sm:text-2xl'>
                {market.title}
              </h1>
              {market.isLive && (
                <span className='inline-flex items-center gap-1 rounded-full bg-trade-red/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-trade-red'>
                  <IconLivePhoto className='size-3' />
                  Live
                </span>
              )}
            </div>
            <p className='text-sm text-trade-text-muted'>
              Time slot: {activeSlot.label}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2 rounded-lg border border-trade-border bg-trade-panel px-4 py-2'>
          <span className='text-sm text-trade-text-muted'>Ends in</span>
          <CountdownTimer endsAt={activeSlot.endsAt} className='text-base' />
        </div>
      </div>

      <div className='grid gap-6 lg:grid-cols-[1fr_340px]'>
        <div className='space-y-4'>
          <div className='grid gap-3 sm:grid-cols-3'>
            <StatCard
              label='Price to beat'
              value={formatUsd(market.priceToBeat)}
            />
            <StatCard
              label='Current price'
              value={formatUsd(market.currentPrice)}
              valueClassName={isAboveBeat ? 'text-trade-green' : 'text-trade-red'}
            />
            <StatCard
              label='Change'
              value={`${isAboveBeat ? '+' : ''}${priceDiff.toFixed(priceDiff < 1 ? 4 : 2)}`}
              valueClassName={isAboveBeat ? 'text-trade-green' : 'text-trade-red'}
            />
          </div>

          <div className='rounded-xl border border-trade-border bg-trade-panel p-4'>
            <PriceChart
              data={market.chartData}
              priceToBeat={market.priceToBeat}
              className='h-[280px] w-full'
            />
          </div>

          <div className='rounded-xl border border-trade-border bg-trade-panel p-4'>
            <p className='mb-3 text-sm font-medium text-trade-text-muted'>
              Time slots
            </p>
            <TimeSlotPicker
              slots={initialSlots}
              onSlotChange={setActiveSlot}
            />
          </div>

          <OrderBook orderBook={market.orderBook} />
          <MarketRules rules={market.rules} />
        </div>

        <div className='space-y-4'>
          <BettingPanel market={market} />
          <RelatedMarkets markets={allMarkets} currentSlug={market.slug} />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClassName
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className='rounded-xl border border-trade-border bg-trade-panel p-4'>
      <p className='mb-1 text-xs text-trade-text-muted'>{label}</p>
      <p className={`text-lg font-semibold text-trade-text ${valueClassName ?? ''}`}>
        {value}
      </p>
    </div>
  );
}

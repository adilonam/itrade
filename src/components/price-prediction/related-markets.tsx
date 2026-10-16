import Link from 'next/link';
import { pricePredictionLinks } from '@/constants/data';
import type { PricePredictionMarket } from '@/lib/price-prediction/mock-data';
import { cn } from '@/lib/utils';

type RelatedMarketsProps = {
  markets: PricePredictionMarket[];
  currentSlug: string;
};

export function RelatedMarkets({ markets, currentSlug }: RelatedMarketsProps) {
  const others = markets.filter((m) => m.slug !== currentSlug);

  return (
    <div className='rounded-xl border border-trade-border bg-trade-panel p-4'>
      <h3 className='mb-3 text-sm font-semibold text-trade-text'>
        Other Markets
      </h3>
      <ul className='space-y-1'>
        {others.map((market) => (
          <li key={market.slug}>
            <Link
              href={pricePredictionLinks.market(market.slug)}
              className='flex items-center justify-between rounded-lg px-2 py-2 transition hover:bg-trade-dark'
            >
              <div className='flex items-center gap-2'>
                <div
                  className='flex size-7 items-center justify-center rounded-full text-[10px] font-bold text-white'
                  style={{ backgroundColor: market.iconColor }}
                >
                  {market.symbol.slice(0, 1)}
                </div>
                <span className='text-sm text-trade-text'>{market.symbol}</span>
              </div>
              <span
                className={cn(
                  'text-sm font-semibold',
                  market.upPercent >= 50 ? 'text-trade-green' : 'text-trade-red'
                )}
              >
                {market.upPercent}% Up
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

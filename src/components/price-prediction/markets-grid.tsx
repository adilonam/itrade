import { MarketCard } from './market-card';
import type { PricePredictionMarket } from '@/lib/price-prediction/mock-data';

type MarketsGridProps = {
  markets: PricePredictionMarket[];
};

export function MarketsGrid({ markets }: MarketsGridProps) {
  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {markets.map((market) => (
        <MarketCard key={market.slug} market={market} />
      ))}
    </div>
  );
}

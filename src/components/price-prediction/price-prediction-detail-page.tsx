import { notFound } from 'next/navigation';
import { PricePredictionShell } from '@/components/price-prediction/price-prediction-shell';
import { MarketDetailView } from '@/components/price-prediction/market-detail-view';
import {
  getAllPricePredictionMarkets,
  getPricePredictionMarket
} from '@/lib/price-prediction/mock-data';
import { getPublicAppName } from '@/lib/public-app-name';
import { getAuthSession } from '@/lib/auth';

type PricePredictionDetailPageProps = {
  slug: string;
};

export async function PricePredictionDetailPage({
  slug
}: PricePredictionDetailPageProps) {
  const market = getPricePredictionMarket(slug);
  if (!market) {
    notFound();
  }

  const [session, appName, allMarkets] = await Promise.all([
    getAuthSession(),
    getPublicAppName(),
    Promise.resolve(getAllPricePredictionMarkets())
  ]);

  return (
    <PricePredictionShell appName={appName} session={Boolean(session)}>
      <MarketDetailView market={market} allMarkets={allMarkets} />
    </PricePredictionShell>
  );
}

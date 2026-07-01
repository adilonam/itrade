import { PricePredictionShell } from '@/components/price-prediction/price-prediction-shell';
import { MarketsGrid } from '@/components/price-prediction/markets-grid';
import { getAllPricePredictionMarkets } from '@/lib/price-prediction/mock-data';
import { getPublicAppName } from '@/lib/public-app-name';
import { getAuthSession } from '@/lib/auth';

export async function PricePredictionListingPage() {
  const [session, appName, markets] = await Promise.all([
    getAuthSession(),
    getPublicAppName(),
    Promise.resolve(getAllPricePredictionMarkets())
  ]);

  return (
    <PricePredictionShell appName={appName} session={Boolean(session)}>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-trade-text sm:text-3xl'>
          Price Prediction Markets
        </h1>
        <p className='mt-1 text-sm text-trade-text-muted'>
          5-minute up/down markets on crypto prices. Mock data for preview.
        </p>
      </div>
      <MarketsGrid markets={markets} />
    </PricePredictionShell>
  );
}

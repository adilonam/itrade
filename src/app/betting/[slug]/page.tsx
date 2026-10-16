import { PricePredictionDetailPage } from '@/components/price-prediction/price-prediction-detail-page';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BettingMarketPage({ params }: PageProps) {
  const { slug } = await params;
  return <PricePredictionDetailPage slug={slug} />;
}

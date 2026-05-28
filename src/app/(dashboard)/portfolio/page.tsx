import { TradingPortfolioOverview } from '@/components/user/portfolio/trading-portfolio-overview';
import { getAuthSession } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('Trade.portfolioPage');
  return {
    title: t('metaTitle')
  };
}

export default async function PortfolioPage() {
  const session = await getAuthSession();
  const t = await getTranslations('Trade.portfolioPage');

  if (!session?.user?.id) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center p-6 text-center text-sm text-[var(--trade-text-muted)]">
        {t('signInRequired')}
      </div>
    );
  }

  return <TradingPortfolioOverview />;
}

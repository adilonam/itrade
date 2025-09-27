import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { TradingViewWidget } from '@/components/trading-view';
import { TradingActions } from '@/components/trading-view/trading-actions';
import { prisma } from '@/lib/prisma';
import { toTradingViewSymbol } from '@/lib/market-symbol';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Dashboard: Trading View'
};

type PageProps = {
  searchParams: Promise<{ marketId?: string }>;
};

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  const marketId = searchParams?.marketId;

  // Fetch market data if marketId is provided
  let market = null;
  let tradingViewSymbol = null;

  if (marketId) {
    market = await prisma.market.findUnique({
      where: { id: marketId }
    });

    if (!market) {
      notFound();
    }
    // Convert to TradingView symbol format
    tradingViewSymbol = toTradingViewSymbol(market);
  }

  return (
    <PageContainer scrollable={false}>
      <div className='flex h-full flex-1 flex-col space-y-6'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Trading View'
            description={
              market
                ? `Advanced charting and technical analysis for ${market.symbol} - ${market.name}`
                : 'Advanced charting and technical analysis tools for trading.'
            }
          />
        </div>
        <Separator />
        <div className='min-h-0 w-full flex-1'>
          <TradingViewWidget symbol={tradingViewSymbol || undefined} />
        </div>
        <TradingActions market={market} />
      </div>
    </PageContainer>
  );
}

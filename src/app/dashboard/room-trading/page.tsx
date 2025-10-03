import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { TradingViewRoomTrading } from '@/components/trading-view/trading-view-room-trading';
import { TradingActionsRoomTrading } from '@/components/trading-view/trading-actions-room-trading';
import { prisma } from '@/lib/prisma';
import { toTradingViewSymbol } from '@/lib/market-symbol';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Dashboard: Room Trading'
};

type PageProps = {
  searchParams: Promise<{ pk?: string }>;
};

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  const marketId = searchParams?.pk;

  // Fetch market data if marketId is provided
  let market = null;
  let tradingViewSymbol = null;

  if (marketId) {
    market = await prisma.market.findUnique({
      where: {
        id: marketId,
        room: 'TRADING', // Only allow TRADING room markets
        visible: true
      }
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
            title='Room Trading'
            description={
              market
                ? `Advanced charting and technical analysis for ${market.symbol} - ${market.name}`
                : 'Advanced charting and technical analysis tools for trading.'
            }
          />
        </div>
        <Separator />
        <div className='min-h-0 w-full flex-1'>
          <TradingViewRoomTrading symbol={tradingViewSymbol || undefined} />
        </div>
        <TradingActionsRoomTrading market={market} />
      </div>
    </PageContainer>
  );
}

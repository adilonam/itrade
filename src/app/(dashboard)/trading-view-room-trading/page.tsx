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
    market = await prisma.market.findFirst({
      where: {
        id: marketId,
        room: 'TRADING',
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
    <div className='h-[calc(100dvh-52px)] overflow-y-auto'>
      <div className='flex min-h-full flex-col space-y-6 p-4 md:px-6'>
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

        {/* Trading View - Full width with responsive height */}
        <div className='h-[500px] w-full md:h-[600px] lg:h-[700px]'>
          <TradingViewRoomTrading
            symbol={tradingViewSymbol || undefined}
            height='100%'
            width='100%'
          />
        </div>

        {/* Trading Actions - Full width */}
        <div className='w-full'>
          <TradingActionsRoomTrading market={market} />
        </div>

        {/* Bottom spacing */}
        <div className='h-8'></div>
      </div>
    </div>
  );
}

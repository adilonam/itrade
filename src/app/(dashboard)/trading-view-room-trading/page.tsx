import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { TradingViewRoomTrading } from '@/components/trading-view/trading-view-room-trading';
import { TradingActionsRoomTrading } from '@/components/trading-view/trading-actions-room-trading';
import { UserPositionsTableCardRoomTrading } from '@/components/user/positions/user-positions-table-room-trading';
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

        {/* Chart left, Trade form right. Small: chart fixed height, form full height (page scrolls). Large: same height, form scrolls inside. */}
        <div className='flex flex-col gap-4 lg:h-[calc(100dvh-220px)] lg:min-h-[400px] lg:flex-row'>
          <div className='flex h-[380px] min-w-0 flex-shrink-0 lg:h-full lg:flex-1'>
            <TradingViewRoomTrading
              symbol={tradingViewSymbol || undefined}
              height='100%'
              width='100%'
            />
          </div>
          <div className='flex w-full max-w-sm shrink-0 flex-col lg:h-full lg:w-72'>
            <TradingActionsRoomTrading market={market} />
          </div>
        </div>

        <Separator />

        {/* Positions table card at bottom */}
        <UserPositionsTableCardRoomTrading />

        {/* Bottom spacing */}
        <div className='h-8'></div>
      </div>
    </div>
  );
}

import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { TradingViewRoomTrading } from '@/components/trading-view/trading-view-room-trading';
import { TradingActionsRoomTrading } from '@/components/trading-view/trading-actions-room-trading';
import { UserPositionsTableCardRoomTrading } from '@/components/user/positions/user-positions-table-room-trading';
import { InstitutionalAccountInfoCard } from '@/components/trading-view/institutional-account-info-card';
import { InstitutionalMarketSelector } from '@/components/trading-view/institutional-market-selector';
import { prisma } from '@/lib/prisma';
import { toTradingViewSymbol } from '@/lib/market-symbol';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Dashboard: Room Institutional'
};

type PageProps = {
  searchParams: Promise<{ pk?: string }>;
};

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  const marketId = searchParams?.pk;

  let market = null;
  let tradingViewSymbol = null;
  const institutionalMarkets = await prisma.market.findMany({
    where: {
      room: 'INSTITUTIONAL',
      visible: true
    },
    select: {
      id: true,
      symbol: true,
      name: true
    },
    orderBy: {
      symbol: 'asc'
    }
  });

  if (marketId) {
    market = await prisma.market.findFirst({
      where: {
        id: marketId,
        room: 'INSTITUTIONAL',
        visible: true
      }
    });

    if (!market) {
      notFound();
    }

    tradingViewSymbol = toTradingViewSymbol(market);
  } else {
    // Default to a visible institutional market so the trade form is ready
    market = await prisma.market.findFirst({
      where: {
        room: 'INSTITUTIONAL',
        visible: true
      }
    });

    if (market) {
      tradingViewSymbol = toTradingViewSymbol(market);
    }
  }

  return (
    <div className='h-[calc(100dvh-52px)] overflow-y-auto'>
      <div className='flex min-h-full flex-col space-y-6 p-4 md:px-6'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Institutional'
            description={
              market
                ? `Institutional charting and execution for ${market.symbol} - ${market.name}`
                : 'Institutional room with INSTITUTIONAL balance and positions.'
            }
          />
        </div>
        <Separator />

        <InstitutionalAccountInfoCard />

        <Separator />

        <div className='flex flex-col gap-4 lg:h-[calc(100dvh-220px)] lg:min-h-[400px] lg:flex-row'>
          <div className='flex h-[380px] min-w-0 flex-shrink-0 lg:h-full lg:flex-1'>
            <TradingViewRoomTrading
              symbol={tradingViewSymbol || undefined}
              height='100%'
              width='100%'
            />
          </div>
          <div className='flex w-full max-w-sm shrink-0 flex-col gap-2 lg:h-full lg:w-72'>
            <InstitutionalMarketSelector
              markets={institutionalMarkets}
              selectedMarketId={market?.id}
            />
            <TradingActionsRoomTrading
              market={market}
              room='INSTITUTIONAL'
              refreshEventName='room-institutional-positions-refresh'
            />
          </div>
        </div>

        <Separator />

        <UserPositionsTableCardRoomTrading
          room='INSTITUTIONAL'
          refreshEventName='room-institutional-positions-refresh'
        />

        <div className='h-8'></div>
      </div>
    </div>
  );
}

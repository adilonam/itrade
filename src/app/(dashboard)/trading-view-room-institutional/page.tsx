import { Separator } from '@/components/ui/separator';
import { UserRoomPositionsTabsPanel } from '@/components/user/positions/user-room-positions-tabs-panel';
import { InstitutionalAccountInfoCard } from '@/components/trading-view/institutional-account-info-card';
import { prisma } from '@/lib/prisma';
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
  } else {
    // Default to a visible institutional market so the trade form is ready
    market = await prisma.market.findFirst({
      where: {
        room: 'INSTITUTIONAL',
        visible: true
      }
    });
  }

  return (
    <div className='min-h-full min-w-0 bg-[var(--trade-dark)] text-[var(--trade-text)] text-sm'>
      <div className='flex min-h-full flex-col space-y-6 p-4 md:px-6'>
        <div className='flex items-start justify-between'>
          <div>
            <h1 className='text-lg font-bold tracking-tight text-[var(--trade-text)]'>
              Institutional
            </h1>
            <p className='mt-1 max-w-2xl text-xs leading-relaxed text-[var(--trade-text-muted)]'>
              {market
                ? `Institutional charting and execution for ${market.symbol} - ${market.name}`
                : 'Institutional room with INSTITUTIONAL balance and positions.'}
            </p>
          </div>
        </div>
        <Separator />

        <InstitutionalAccountInfoCard />

        <Separator />

        <UserRoomPositionsTabsPanel
          layout='standalone-card'
          room='INSTITUTIONAL'
          refreshEventName='room-institutional-positions-refresh'
          showFinanceTab={false}
        />

        <div className='h-8'></div>
      </div>
    </div>
  );
}

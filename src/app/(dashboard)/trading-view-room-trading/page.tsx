import { TradingRoomLayout } from '@/components/trading-room/trading-room-layout';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'Dashboard: Room Trading'
};

type PageProps = {
  searchParams: Promise<{ pk?: string }>;
};

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  const marketId = searchParams?.pk ?? null;

  let initialMarket = null;
  let initialSymbols: Awaited<ReturnType<typeof prisma.market.findMany>> = [];

  if (marketId) {
    initialMarket = await prisma.market.findFirst({
      where: {
        id: marketId,
        room: 'TRADING',
        visible: true
      }
    });
  }

  try {
    initialSymbols = await prisma.market.findMany({
      where: { room: 'TRADING', visible: true },
      orderBy: { symbol: 'asc' },
      take: 50
    });
  } catch {
    // use mock data when API unavailable
  }

  return (
    <TradingRoomLayout
      initialMarket={initialMarket}
      initialSymbols={initialSymbols}
    />
  );
}

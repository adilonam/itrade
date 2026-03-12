import { TradingRoomLayout } from '@/components/trading-room/trading-room-layout';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'Overview Test'
};

export default async function Page() {
  let initialSymbols: Awaited<ReturnType<typeof prisma.market.findMany>> = [];

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
      initialMarket={null}
      initialSymbols={initialSymbols}
      noNavigation
    />
  );
}

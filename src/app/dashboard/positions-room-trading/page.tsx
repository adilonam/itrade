import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { UserPositionsViewRoomTrading } from '@/components/user/positions/user-positions-view-room-trading';
import { UserFinanceCard } from '@/components/user/finance/user-finance-card';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'Dashboard: My Positions Room Trading'
};

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <PageContainer scrollable={true}>
        <div className='flex flex-1 flex-col space-y-6'>
          <div className='flex items-start justify-between'>
            <Heading
              title='My Positions Room Trading'
              description='View and manage your room trading positions.'
            />
          </div>
          <Separator />
          <div className='text-muted-foreground text-center'>
            Please sign in to view your positions.
          </div>
        </div>
      </PageContainer>
    );
  }

  // Fetch user financial data
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      balance: true,
      usedMargin: true
    }
  });

  if (!user) {
    return (
      <PageContainer scrollable={true}>
        <div className='flex flex-1 flex-col space-y-6'>
          <div className='flex items-start justify-between'>
            <Heading
              title='My Positions Room Trading'
              description='View and manage your room trading positions.'
            />
          </div>
          <Separator />
          <div className='text-muted-foreground text-center'>
            User not found.
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-start justify-between'>
          <Heading
            title='My Positions Room Trading'
            description='View and manage your room trading positions.'
          />
        </div>
        <Separator />

        {/* Finance Info Card */}
        <UserFinanceCard
          balance={user.balance}
          usedMargin={user.usedMargin}
          equity={user.balance} // As requested, equity equals balance for now
        />

        <UserPositionsViewRoomTrading />
      </div>
    </PageContainer>
  );
}

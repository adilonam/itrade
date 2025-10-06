import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { UserPositionsViewRoomTrading } from '@/components/user/positions/user-positions-view-room-trading';

export const metadata = {
  title: 'Dashboard: My Positions Room Trading'
};

export default async function Page() {
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
        <UserPositionsViewRoomTrading />
      </div>
    </PageContainer>
  );
}

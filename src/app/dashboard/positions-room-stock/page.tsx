import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { UserPositionsViewRoomStock } from '@/components/user/positions/user-positions-view-room-stock';

export const metadata = {
  title: 'Dashboard: Positions'
};

export default async function Page() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-start justify-between'>
          <Heading
            title='My Positions'
            description='View and manage your trading positions.'
          />
        </div>
        <Separator />
        <UserPositionsViewRoomStock />
      </div>
    </PageContainer>
  );
}

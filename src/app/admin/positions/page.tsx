import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { PositionsView } from '@/components/admin/positions/positions-view';

export const metadata = {
  title: 'Admin: Positions'
};

export default async function Page() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Positions'
            description='Manage and monitor all user positions in the system.'
          />
        </div>
        <Separator />
        <PositionsView />
      </div>
    </PageContainer>
  );
}

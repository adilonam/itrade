import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { UserTransactionsViewRoomTrading } from '@/components/user/transactions/user-transactions-view-room-trading';

export const metadata = {
  title: 'Dashboard: My Transactions Room Trading'
};

export default async function Page() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-start justify-between'>
          <Heading
            title='My Transactions Room Trading'
            description='View and manage your room trading transactions.'
          />
        </div>
        <Separator />
        <UserTransactionsViewRoomTrading />
      </div>
    </PageContainer>
  );
}

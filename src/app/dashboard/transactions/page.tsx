import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { UserTransactionsView } from '@/components/user/transactions/user-transactions-view';

export const metadata = {
  title: 'Dashboard: Transactions'
};

export default async function Page() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-start justify-between'>
          <Heading
            title='My Transactions'
            description='View and manage your trading transactions.'
          />
        </div>
        <Separator />
        <UserTransactionsView />
      </div>
    </PageContainer>
  );
}

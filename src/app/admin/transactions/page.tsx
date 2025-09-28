import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { TransactionsView } from '@/components/admin/transactions/transactions-view';

export const metadata = {
  title: 'Admin: Transactions'
};

export default async function Page() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Transactions'
            description='Manage and monitor all user transactions in the system.'
          />
        </div>
        <Separator />
        <TransactionsView />
      </div>
    </PageContainer>
  );
}

import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import UserTransactionsListing from '@/features/user/components/user-transactions-listing';
import { Suspense } from 'react';

export const metadata = {
  title: 'Transactions'
};

export default async function Page() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Transactions'
            description='View and manage all your transactions.'
          />
        </div>
        <Separator />
        <Suspense fallback={<div>Loading transactions...</div>}>
          <UserTransactionsListing />
        </Suspense>
      </div>
    </PageContainer>
  );
}

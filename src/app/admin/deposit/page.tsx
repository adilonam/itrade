import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import DepositRequestsListing from '@/features/admin/components/deposit-requests/deposit-requests-listing';
import { Suspense } from 'react';

export const metadata = {
  title: 'Admin: Deposit Requests'
};

export default function AdminDepositRequestsPage() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Deposit requests'
            description='Review crypto deposits. Manual USDT requests are credited when you set status to Finished (after you verify the on-chain transfer). NOWPayments deposits credit via webhook.'
          />
        </div>
        <Separator />
        <Suspense fallback={<div>Loading...</div>}>
          <DepositRequestsListing />
        </Suspense>
      </div>
    </PageContainer>
  );
}

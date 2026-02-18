import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import WithdrawRequestsListing from '@/features/admin/components/withdraw-requests/withdraw-requests-listing';
import { Suspense } from 'react';

export const metadata = {
  title: 'Admin: Withdraw Requests'
};

export default function AdminWithdrawRequestsPage() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Withdraw requests'
            description='View and update status of user withdrawal requests. Rejected requests are refunded automatically.'
          />
        </div>
        <Separator />
        <Suspense fallback={<div>Loading...</div>}>
          <WithdrawRequestsListing />
        </Suspense>
      </div>
    </PageContainer>
  );
}

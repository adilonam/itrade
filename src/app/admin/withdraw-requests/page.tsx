import PageContainer from '@/components/layout/page-container';
import { Separator } from '@/components/ui/separator';
import WithdrawRequestsListing from '@/features/admin/components/withdraw-requests/withdraw-requests-listing';
import { Suspense } from 'react';

export const metadata = {
  title: 'Admin: Withdraw Requests'
};

export default function AdminWithdrawRequestsPage() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6 text-sm text-[var(--trade-text)]'>
        <div className='flex items-start justify-between'>
          <div>
            <h1 className='text-lg font-bold tracking-tight text-[var(--trade-text)]'>
              Withdraw requests
            </h1>
            <p className='mt-1 max-w-2xl text-xs leading-relaxed text-[var(--trade-text-muted)]'>
              View and update status of user withdrawal requests. Rejected
              requests are refunded automatically.
            </p>
          </div>
        </div>
        <Separator />
        <Suspense
          fallback={
            <div className='h-28 animate-pulse rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)]/40' />
          }
        >
          <WithdrawRequestsListing />
        </Suspense>
      </div>
    </PageContainer>
  );
}

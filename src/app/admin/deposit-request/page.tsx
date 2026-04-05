import PageContainer from '@/components/layout/page-container';
import DepositRequestsListing from '@/features/admin/components/deposit-requests/deposit-requests-listing';
import { Suspense } from 'react';

export const metadata = {
  title: 'Admin: Deposit request'
};

export default function AdminDepositRequestPage() {
  return (
    <PageContainer scrollable={true}>
      <div className='min-w-0 max-w-full space-y-6 text-sm text-[var(--trade-text)]'>
        <div>
          <h1 className='text-lg font-bold tracking-tight text-[var(--trade-text)]'>
            Deposit request
          </h1>
          <p className='mt-1 max-w-3xl text-xs leading-relaxed text-[var(--trade-text-muted)]'>
            Review crypto deposits. Manual USDT requests are credited when you set
            status to Finished (after you verify the on-chain transfer).
            NOWPayments deposits credit via webhook.
          </p>
        </div>
        <Suspense
          fallback={
            <div className='flex min-h-[200px] items-center justify-center rounded-xl border border-[var(--trade-border)] bg-[var(--trade-panel)] text-[var(--trade-text-muted)]'>
              Loading…
            </div>
          }
        >
          <DepositRequestsListing />
        </Suspense>
      </div>
    </PageContainer>
  );
}

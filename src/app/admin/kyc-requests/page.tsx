import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import KycRequestsListing from '@/features/admin/components/kyc-requests/kyc-requests-listing';
import { Suspense } from 'react';

export const metadata = {
  title: 'Admin: KYC Requests'
};

export default function AdminKycRequestsPage() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='KYC requests'
            description='Review user identity verification requests and update their status.'
          />
        </div>
        <Separator />
        <Suspense fallback={<div>Loading...</div>}>
          <KycRequestsListing />
        </Suspense>
      </div>
    </PageContainer>
  );
}

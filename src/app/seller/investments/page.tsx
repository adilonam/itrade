import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import SellerInvestmentsListing from '@/features/seller/components/seller-investments-listing';
import { Suspense } from 'react';

export const metadata = {
  title: 'Seller: Investments'
};

export default async function Page() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Investments'
            description='View and manage investments of your linked users.'
          />
        </div>
        <Separator />
        <Suspense fallback={<div>Loading investments...</div>}>
          <SellerInvestmentsListing />
        </Suspense>
      </div>
    </PageContainer>
  );
}

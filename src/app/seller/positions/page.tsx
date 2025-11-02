import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import SellerPositionsPage from '@/features/seller/components/seller-positions-listing';
import { Suspense } from 'react';

export const metadata = {
  title: 'Seller: Positions'
};

export default async function Page() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Positions'
            description='View and manage positions of your linked users.'
          />
        </div>
        <Separator />
        <Suspense fallback={<div>Loading positions...</div>}>
          <SellerPositionsPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}

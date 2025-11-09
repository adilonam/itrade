import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import SellerMessagesListing from '@/features/seller/components/seller-messages-listing';
import { Suspense } from 'react';

export const metadata = {
  title: 'Seller: Messages'
};

export default async function Page() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Messages'
            description='View and manage messages with your linked users.'
          />
        </div>
        <Separator />
        <Suspense fallback={<div>Loading messages...</div>}>
          <SellerMessagesListing />
        </Suspense>
      </div>
    </PageContainer>
  );
}

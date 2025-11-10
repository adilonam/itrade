import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import UserMessagesListing from '@/features/user/components/user-messages-listing';
import { Suspense } from 'react';

export const metadata = {
  title: 'Messages'
};

export default async function Page() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Messages'
            description='View and manage all your messages.'
          />
        </div>
        <Separator />
        <Suspense fallback={<div>Loading messages...</div>}>
          <UserMessagesListing />
        </Suspense>
      </div>
    </PageContainer>
  );
}

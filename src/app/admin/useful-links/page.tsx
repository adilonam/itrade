import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import UsefulLinksListing from '@/features/admin/components/useful-links/useful-links-listing';
import { Suspense } from 'react';

export const metadata = {
  title: 'Admin: Useful Links'
};

export default function AdminUsefulLinksPage() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Useful links'
            description='Manage links shown on the user useful-links page.'
          />
        </div>
        <Separator />
        <Suspense fallback={<div>Loading...</div>}>
          <UsefulLinksListing />
        </Suspense>
      </div>
    </PageContainer>
  );
}

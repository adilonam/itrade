import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import UsefulLinksView from '@/components/useful-links/useful-links-view';
import { Suspense } from 'react';

export const metadata = {
  title: 'Useful Links'
};

export default function UsefulLinksPage() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Useful links'
            description='Quick links and resources.'
          />
        </div>
        <Separator />
        <Suspense fallback={<div>Loading links...</div>}>
          <UsefulLinksView />
        </Suspense>
      </div>
    </PageContainer>
  );
}

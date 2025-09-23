import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import UserViewPage from '@/features/admin/components/user-view-page';

export const metadata = {
  title: 'Admin: Create New User'
};

export default function Page() {
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <UserViewPage userId='new' />
        </Suspense>
      </div>
    </PageContainer>
  );
}

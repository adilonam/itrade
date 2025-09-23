import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import UserViewPage from '@/features/admin/components/user-view-page';

export const metadata = {
  title: 'Admin: Edit User'
};

type PageProps = { params: Promise<{ id: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <UserViewPage userId={params.id} />
        </Suspense>
      </div>
    </PageContainer>
  );
}

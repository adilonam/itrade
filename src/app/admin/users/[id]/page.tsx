import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import UserDetailWrapper from './user-detail-wrapper';

export const metadata = {
  title: 'Admin: User Details'
};

type PageProps = { params: Promise<{ id: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;

  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <UserDetailWrapper userId={params.id} />
        </Suspense>
      </div>
    </PageContainer>
  );
}

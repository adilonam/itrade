import PageContainer from '@/components/layout/page-container';
import ProfileViewPage from '@/features/profile/components/profile-view-page';

export const metadata = {
  title: 'Dashboard : Profile'
};

export default async function Page() {
  return (
    <PageContainer scrollable={true}>
      <ProfileViewPage />
    </PageContainer>
  );
}

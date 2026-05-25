import { redirect } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { getAuthSession } from '@/lib/auth';

import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('Overview');
  return {
    title: t('title'),
    description: t('welcome', { name: '' })
  };
}

export default async function Dashboard() {
  const session = await getAuthSession();

  if (!session) {
    return redirect('/auth/sign-in');
  }

  return (
    <PageContainer scrollable={true}>
      <DashboardOverview />
    </PageContainer>
  );
}

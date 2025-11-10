import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';

export const metadata = {
  title: 'Dashboard: Overview',
  description: 'View your comprehensive trading and investment portfolio'
};

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return redirect('/auth/sign-in');
  }

  return (
    <PageContainer scrollable={true}>
      <DashboardOverview />
    </PageContainer>
  );
}

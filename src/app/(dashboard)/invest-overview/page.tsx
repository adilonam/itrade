import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { InvestOverview } from '@/components/dashboard/invest-overview';

export const metadata = {
  title: 'Invest Overview',
  description: 'Investment dashboard and stats'
};

export default async function InvestOverviewPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return redirect('/auth/sign-in');
  }

  return (
    <PageContainer scrollable={true}>
      <InvestOverview />
    </PageContainer>
  );
}

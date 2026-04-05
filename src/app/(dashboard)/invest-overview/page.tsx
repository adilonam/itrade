import { redirect } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { InvestOverview } from '@/components/dashboard/invest-overview';
import { getAuthSession } from '@/lib/auth';

export const metadata = {
  title: 'Invest Overview',
  description: 'Investment dashboard and stats'
};

export default async function InvestOverviewPage() {
  const session = await getAuthSession();

  if (!session) {
    return redirect('/auth/sign-in');
  }

  return (
    <PageContainer scrollable={true}>
      <InvestOverview />
    </PageContainer>
  );
}

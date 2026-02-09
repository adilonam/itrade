import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { NewsFeedView } from '@/features/news/components/news-feed-view';

export const metadata = {
  title: 'Dashboard: News',
  description: 'Market news and sentiment from Alpha Vantage'
};

export default async function NewsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return redirect('/auth/sign-in');
  }

  return (
    <PageContainer scrollable={true}>
      <NewsFeedView />
    </PageContainer>
  );
}

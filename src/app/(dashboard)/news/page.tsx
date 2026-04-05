import { redirect } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { NewsFeedView } from '@/features/news/components/news-feed-view';
import { getAuthSession } from '@/lib/auth';

export const metadata = {
  title: 'Dashboard: News',
  description: 'Market news and sentiment from Alpha Vantage'
};

export default async function NewsPage() {
  const session = await getAuthSession();

  if (!session) {
    return redirect('/auth/sign-in');
  }

  return (
    <PageContainer scrollable={true}>
      <NewsFeedView />
    </PageContainer>
  );
}

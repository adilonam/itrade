import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { MarketsView } from '@/components/markets/markets-view';

export const metadata = {
  title: 'Dashboard: Markets'
};

export default async function Page() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Markets'
            description='Monitor forex pairs and cryptocurrency prices in real-time.'
          />
        </div>
        <Separator />
        <MarketsView />
      </div>
    </PageContainer>
  );
}

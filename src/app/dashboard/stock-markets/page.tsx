import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { StockMarketsView } from '@/components/markets/stock-markets-view';

export const metadata = {
  title: 'Dashboard: Stock Markets'
};

export default async function Page() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Stock Markets'
            description='Monitor stock prices and market movements in real-time.'
          />
        </div>
        <Separator />

        <StockMarketsView />
      </div>
    </PageContainer>
  );
}

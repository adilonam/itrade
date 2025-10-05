import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { MarketTrading } from '@/components/markets/market-trading';

export const metadata = {
  title: 'Dashboard: Market Trading'
};

export default async function Page() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Market Trading'
            description='Select a market to start trading with advanced charting and analysis tools.'
          />
        </div>
        <Separator />

        <MarketTrading />
      </div>
    </PageContainer>
  );
}

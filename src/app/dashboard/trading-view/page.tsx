import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { TradingViewWidget } from '@/components/trading-view';

export const metadata = {
  title: 'Dashboard: Trading View'
};

export default async function Page() {
  return (
    <PageContainer scrollable={false}>
      <div className='flex h-full flex-1 flex-col space-y-6'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Trading View'
            description='Advanced charting and technical analysis tools for trading.'
          />
        </div>
        <Separator />
        <div className='min-h-0 w-full flex-1'>
          <TradingViewWidget />
        </div>
      </div>
    </PageContainer>
  );
}

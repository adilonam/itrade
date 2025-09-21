import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { TradingViewWidget } from '@/components/trading-view';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Dashboard: Trading View'
};

export default async function Page({
  searchParams
}: {
  searchParams: { symbol?: string };
}) {
  const symbol = searchParams?.symbol;
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
          <TradingViewWidget symbol={symbol} />
        </div>
        <div className='flex items-center justify-end gap-2 pt-2'>
          <Button variant='destructive' aria-label='Sell'>
            Sell
          </Button>
          <Button
            aria-label='Buy'
            className='bg-green-600 text-white hover:bg-green-700'
          >
            Buy
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}

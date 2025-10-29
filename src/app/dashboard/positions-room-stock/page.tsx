import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { StockPortfolioView } from '@/components/user/portfolio/stock-portfolio-view';

export const metadata = {
  title: 'Dashboard: Stock Portfolio'
};

export default async function Page() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-start justify-between'>
          <Heading
            title='My Portfolio'
            description='View and manage your portfolio.'
          />
        </div>
        <Separator />
        <StockPortfolioView />
      </div>
    </PageContainer>
  );
}

import PageContainer from '@/components/layout/page-container';
import { BinaryOptionsTradingScreen } from '@/components/binary-options/binary-options-trading-screen';

export const metadata = {
  title: 'Binary Option Trade'
};

export default async function BinaryOptionTradePage() {
  return (
    <PageContainer scrollable>
      <BinaryOptionsTradingScreen />
    </PageContainer>
  );
}

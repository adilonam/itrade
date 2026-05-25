import { TradingRoomTradeMain } from '@/components/trading-room/trading-room-trade-main';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('Trade');
  return {
    title: t('metadataTitle')
  };
}

export default function Page() {
  return <TradingRoomTradeMain />;
}

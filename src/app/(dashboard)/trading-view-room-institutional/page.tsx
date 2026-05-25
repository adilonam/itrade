import { InstitutionalRoomPageContent } from '@/components/trading-view/institutional-room-page-content';
import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

export async function generateMetadata() {
  const t = await getTranslations('Institutional');
  return {
    title: t('title')
  };
}

type PageProps = {
  searchParams: Promise<{ pk?: string }>;
};

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  const marketId = searchParams?.pk;

  let market = null;

  if (marketId) {
    market = await prisma.market.findFirst({
      where: {
        id: marketId,
        room: 'INSTITUTIONAL',
        visible: true
      }
    });

    if (!market) {
      notFound();
    }
  } else {
    market = await prisma.market.findFirst({
      where: {
        room: 'INSTITUTIONAL',
        visible: true
      }
    });
  }

  return (
    <InstitutionalRoomPageContent
      symbol={market?.symbol}
      name={market?.name}
    />
  );
}

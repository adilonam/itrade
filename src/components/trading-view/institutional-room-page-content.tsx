'use client';

import { useTranslations } from 'next-intl';
import { Separator } from '@/components/ui/separator';
import { UserRoomPositionsTabsPanel } from '@/components/user/positions/user-room-positions-tabs-panel';
import { InstitutionalAccountInfoCard } from '@/components/trading-view/institutional-account-info-card';

type InstitutionalRoomPageContentProps = {
  symbol?: string;
  name?: string;
};

export function InstitutionalRoomPageContent({
  symbol,
  name
}: InstitutionalRoomPageContentProps) {
  const t = useTranslations('Institutional');

  return (
    <div className="min-h-full min-w-0 bg-[var(--trade-dark)] text-[var(--trade-text)] text-sm">
      <div className="flex min-h-full flex-col space-y-6 p-4 md:px-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[var(--trade-text)]">
              {t('title')}
            </h1>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--trade-text-muted)]">
              {symbol && name
                ? t('subtitleWithMarket', { symbol, name })
                : t('subtitleDefault')}
            </p>
          </div>
        </div>
        <Separator />

        <InstitutionalAccountInfoCard />

        <Separator />

        <UserRoomPositionsTabsPanel
          layout="standalone-card"
          room="TRADING"
          refreshEventName="room-institutional-positions-refresh"
          showFinanceTab={false}
        />

        <div className="h-8" />
      </div>
    </div>
  );
}

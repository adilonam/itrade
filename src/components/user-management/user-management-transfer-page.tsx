'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { BalanceTransferTransactionsList } from '@/components/user-management/balance-transfer-transactions-list';
import { InstitutionalBalanceTransferCard } from '@/components/trading-view/institutional-balance-transfer-card';
import { UserManagementPageHeader } from '@/components/user-management/user-management-page-header';

export function UserManagementTransferPage() {
  const t = useTranslations('UserManagement.transfer');
  const [transferHistoryKey, setTransferHistoryKey] = useState(0);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <UserManagementPageHeader title={t('title')} description={t('description')} />

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="mx-auto w-full max-w-3xl space-y-8">
          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--trade-text)]">
                {t('betweenBalances')}
              </h2>
              <p className="mt-1 text-xs text-[var(--trade-text-muted)]">
                {t('betweenBalancesHint')}
              </p>
            </div>
            <InstitutionalBalanceTransferCard
              className="shadow-sm"
              onTransferComplete={() =>
                setTransferHistoryKey((k) => k + 1)
              }
            />
          </section>

          <BalanceTransferTransactionsList refreshKey={transferHistoryKey} />
        </div>
      </div>
    </div>
  );
}

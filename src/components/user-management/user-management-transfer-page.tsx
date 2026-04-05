'use client';

import { useState } from 'react';
import { BalanceTransferTransactionsList } from '@/components/user-management/balance-transfer-transactions-list';
import { InstitutionalBalanceTransferCard } from '@/components/trading-view/institutional-balance-transfer-card';

export function UserManagementTransferPage() {
  const [transferHistoryKey, setTransferHistoryKey] = useState(0);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <header className="shrink-0 border-b border-[var(--trade-border)] bg-[var(--trade-panel)] px-6 py-4">
        <h1 className="text-base font-semibold text-[var(--trade-text)]">
          Transfer
        </h1>
        <p className="mt-1 text-sm text-[var(--trade-text-muted)]">
          Move funds between your REAL and INSTITUTIONAL balances on your account.
        </p>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="mx-auto w-full max-w-3xl space-y-8">
          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--trade-text)]">
                Between your balances
              </h2>
              <p className="mt-1 text-xs text-[var(--trade-text-muted)]">
                Transfer instantly between REAL and INSTITUTIONAL wallets on your
                account.
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

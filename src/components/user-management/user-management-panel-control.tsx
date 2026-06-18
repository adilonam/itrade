'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { IconLoader2 } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { UserManagementPageHeader } from '@/components/user-management/user-management-page-header';
import { cn } from '@/lib/utils';
import type { FinancialSnapshot } from '@/components/dashboard/dashboard-overview-trade-analytics';

type ApiTransaction = {
  id: string;
  type:
    | 'GAIN'
    | 'INVESTMENT_GAIN'
    | 'LOSS'
    | 'DEPOSIT'
    | 'WITHDRAW'
    | 'TRANSFER_IN'
    | 'TRANSFER_OUT';
  balanceType: 'REAL' | 'DEMO' | 'INSTITUTIONAL';
  absoluteAmount: number;
  description: string | null;
  createdAt: string;
};

const fmtUsd = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n);

function txTypeLabel(
  type: ApiTransaction['type'],
  t: ReturnType<typeof useTranslations<'UserManagement.dashboard'>>
) {
  switch (type) {
    case 'GAIN':
      return t('txGain');
    case 'INVESTMENT_GAIN':
      return t('txInvestmentGain');
    case 'LOSS':
      return t('txLoss');
    case 'DEPOSIT':
      return t('txDeposit');
    case 'WITHDRAW':
      return t('txWithdraw');
    case 'TRANSFER_IN':
      return t('txTransferIn');
    case 'TRANSFER_OUT':
      return t('txTransferOut');
    default:
      return type;
  }
}

function walletLabel(
  balanceType: ApiTransaction['balanceType'],
  t: ReturnType<typeof useTranslations<'UserManagement.dashboard'>>
) {
  switch (balanceType) {
    case 'REAL':
      return t('walletReal');
    case 'DEMO':
      return t('walletDemo');
    case 'INSTITUTIONAL':
      return t('walletInstitutional');
    default:
      return balanceType;
  }
}

function formatTxAmount(amount: number, type: ApiTransaction['type']) {
  const sign =
    type === 'GAIN' ||
    type === 'INVESTMENT_GAIN' ||
    type === 'DEPOSIT' ||
    type === 'TRANSFER_IN'
      ? '+'
      : '−';
  return `${sign}${Math.abs(amount).toFixed(2)}`;
}

function txAmountClass(type: ApiTransaction['type']) {
  if (
    type === 'GAIN' ||
    type === 'INVESTMENT_GAIN' ||
    type === 'DEPOSIT' ||
    type === 'TRANSFER_IN'
  ) {
    return 'text-[var(--trade-green)]';
  }
  return 'text-[var(--trade-red)]';
}

function formatTxDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function BalanceCard({
  accountLabel,
  balanceLabel,
  balanceFormatted,
  ghost,
  footer
}: {
  accountLabel: string;
  balanceLabel: string;
  balanceFormatted: string;
  ghost: string;
  footer: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'relative flex min-h-[160px] flex-col overflow-hidden rounded-xl bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-600 p-5 text-white shadow-sm'
      )}
    >
      <span
        className="pointer-events-none absolute -right-2 bottom-0 select-none text-[5rem] font-bold leading-none opacity-[0.12]"
        aria-hidden
      >
        {ghost}
      </span>
      <div className="relative z-[1] text-xs font-medium uppercase tracking-wide opacity-90">
        {accountLabel}
      </div>
      <div className="relative z-[1] mt-2">
        <div className="text-sm opacity-90">{balanceLabel}</div>
        <div className="mt-1 font-mono text-2xl font-bold tracking-tight">
          {balanceFormatted}
        </div>
      </div>
      <div className="relative z-[1] mt-auto border-t border-white/20 pt-3 text-xs leading-snug opacity-95">
        {footer}
      </div>
    </div>
  );
}

function BalanceCardsSkeleton() {
  return (
    <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="h-[160px] animate-pulse rounded-xl bg-[var(--trade-border)]"
        />
      ))}
    </div>
  );
}

function AccountBalanceRow({
  financial,
  accountLabel,
  ghost,
  t
}: {
  financial: FinancialSnapshot;
  accountLabel: string;
  ghost: string;
  t: ReturnType<typeof useTranslations<'UserManagement.dashboard'>>;
}) {
  return (
    <BalanceCard
      accountLabel={accountLabel}
      balanceLabel={t('balance')}
      balanceFormatted={fmtUsd(financial.balance)}
      ghost={ghost}
      footer={
        <div className="flex flex-col gap-1">
          <span>
            {t('equity')} {fmtUsd(financial.equity)}
          </span>
          <span className="opacity-90">
            {t('freeMargin')} {fmtUsd(financial.freeMargin)} · {t('leverage')}{' '}
            {financial.leverage}×
          </span>
        </div>
      }
    />
  );
}

export function UserManagementPanelControl() {
  const t = useTranslations('UserManagement.dashboard');
  const [financialReal, setFinancialReal] = useState<FinancialSnapshot | null>(
    null
  );
  const [financialDemo, setFinancialDemo] = useState<FinancialSnapshot | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txLoading, setTxLoading] = useState(true);
  const [txError, setTxError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);

  const loadTransactions = useCallback(async () => {
    try {
      setTxLoading(true);
      setTxError(null);
      const res = await fetch(
        '/api/user/transactions?limit=8&page=1&balanceType=REAL&types=DEPOSIT,WITHDRAW'
      );
      if (res.status === 401) {
        setTxError(t('signInTransactions'));
        setTransactions([]);
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to load transactions');
      }
      const data = (await res.json()) as { transactions?: ApiTransaction[] };
      setTransactions(data.transactions ?? []);
    } catch {
      setTxError(t('loadTransactionsError'));
      setTransactions([]);
    } finally {
      setTxLoading(false);
    }
  }, [t]);

  const loadBalances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [realRes, demoRes] = await Promise.all([
        fetch('/api/user/financial?balanceType=REAL'),
        fetch('/api/user/financial?balanceType=DEMO')
      ]);

      if (realRes.status === 401 || demoRes.status === 401) {
        setError(t('signInBalances'));
        setFinancialReal(null);
        setFinancialDemo(null);
        return;
      }

      if (!realRes.ok || !demoRes.ok) {
        throw new Error('Failed to load balances');
      }

      const [real, demo] = await Promise.all([
        realRes.json() as Promise<FinancialSnapshot>,
        demoRes.json() as Promise<FinancialSnapshot>
      ]);

      setFinancialReal(real);
      setFinancialDemo(demo);
    } catch {
      setError(t('loadBalancesError'));
      setFinancialReal(null);
      setFinancialDemo(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadBalances();
  }, [loadBalances]);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  const showCards = financialReal && financialDemo && !error;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <UserManagementPageHeader title={t('title')} compact />

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            {error && (
              <p className="text-sm text-[var(--trade-red)]">{error}</p>
            )}
            {loading && !showCards ? (
              <BalanceCardsSkeleton />
            ) : showCards ? (
              <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
                <AccountBalanceRow
                  financial={financialReal}
                  accountLabel={t('walletReal')}
                  ghost="REAL"
                  t={t}
                />
                <AccountBalanceRow
                  financial={financialDemo}
                  accountLabel={t('walletDemo')}
                  ghost="DEMO"
                  t={t}
                />
              </div>
            ) : null}
          </div>
          <Link
            href="/user-management/settings"
            className="shrink-0 text-sm font-medium text-[var(--trade-accent-blue)] hover:underline"
          >
            {t('accountSettings')}
          </Link>
        </div>

        <section className="rounded-xl border border-[var(--trade-border)] bg-[var(--trade-panel)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--trade-border)] px-4 py-3">
            <h2 className="text-sm font-semibold text-[var(--trade-text)]">
              {t('transactionHistory')}
            </h2>
            <Link
              href="/user-management/transaction-history"
              className="rounded-full bg-[var(--trade-border)]/50 px-3 py-1 text-xs font-medium text-[var(--trade-text)] hover:bg-[var(--trade-border)]"
            >
              {t('viewAll')}
            </Link>
          </div>
          {txError && (
            <p className="border-b border-[var(--trade-border)] px-4 py-2 text-sm text-[var(--trade-red)]">
              {txError}
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--trade-border)] text-xs text-[var(--trade-text-muted)]">
                  <th className="px-4 py-3 font-medium">{t('tableType')}</th>
                  <th className="px-4 py-3 font-medium">{t('tableDescription')}</th>
                  <th className="px-4 py-3 font-medium">{t('tableAmount')}</th>
                  <th className="px-4 py-3 font-medium">{t('tableWallet')}</th>
                  <th className="px-4 py-3 font-medium">{t('tableDate')}</th>
                </tr>
              </thead>
              <tbody>
                {txLoading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-[var(--trade-text-muted)]"
                    >
                      <span className="inline-flex items-center gap-2">
                        <IconLoader2
                          className="size-5 shrink-0 animate-spin"
                          aria-hidden
                        />
                        {t('loadingTransactions')}
                      </span>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-[var(--trade-text-muted)]"
                    >
                      {t('noTransactions')}
                    </td>
                  </tr>
                ) : (
                  transactions.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[var(--trade-border)]/80 last:border-0"
                    >
                      <td className="px-4 py-3 text-[var(--trade-text)]">
                        {txTypeLabel(row.type, t)}
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-[var(--trade-text)]">
                        {row.description?.trim() || '—'}
                      </td>
                      <td
                        className={cn(
                          'px-4 py-3 font-mono font-medium',
                          txAmountClass(row.type)
                        )}
                      >
                        {formatTxAmount(row.absoluteAmount, row.type)}
                      </td>
                      <td className="px-4 py-3 text-[var(--trade-text-muted)]">
                        {walletLabel(row.balanceType, t)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--trade-text-muted)]">
                        {formatTxDate(row.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

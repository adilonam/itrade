'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { IconLoader2 } from '@tabler/icons-react';
import { ModeToggle } from '@/components/layout/ThemeToggle/theme-toggle';
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

function txTypeLabel(type: ApiTransaction['type']) {
  switch (type) {
    case 'GAIN':
      return 'Gain';
    case 'INVESTMENT_GAIN':
      return 'Investment gain';
    case 'LOSS':
      return 'Loss';
    case 'DEPOSIT':
      return 'Deposit';
    case 'WITHDRAW':
      return 'Withdraw';
    case 'TRANSFER_IN':
      return 'Transfer in';
    case 'TRANSFER_OUT':
      return 'Transfer out';
    default:
      return type;
  }
}

function walletLabel(balanceType: ApiTransaction['balanceType']) {
  switch (balanceType) {
    case 'REAL':
      return 'Real';
    case 'DEMO':
      return 'Demo';
    case 'INSTITUTIONAL':
      return 'Institutional';
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
    <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
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
  ghost
}: {
  financial: FinancialSnapshot;
  accountLabel: string;
  ghost: string;
}) {
  return (
    <BalanceCard
      accountLabel={accountLabel}
      balanceLabel="Balance"
      balanceFormatted={fmtUsd(financial.balance)}
      ghost={ghost}
      footer={
        <div className="flex flex-col gap-1">
          <span>Equity {fmtUsd(financial.equity)}</span>
          <span className="opacity-90">
            Free margin {fmtUsd(financial.freeMargin)} · Lev {financial.leverage}×
          </span>
        </div>
      }
    />
  );
}

export function UserManagementPanelControl() {
  const [financialReal, setFinancialReal] = useState<FinancialSnapshot | null>(
    null
  );
  const [financialDemo, setFinancialDemo] = useState<FinancialSnapshot | null>(
    null
  );
  const [financialInstitutional, setFinancialInstitutional] =
    useState<FinancialSnapshot | null>(null);
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
        setTxError('Sign in to view transactions.');
        setTransactions([]);
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to load transactions');
      }
      const data = (await res.json()) as { transactions?: ApiTransaction[] };
      setTransactions(data.transactions ?? []);
    } catch {
      setTxError('Could not load transactions.');
      setTransactions([]);
    } finally {
      setTxLoading(false);
    }
  }, []);

  const loadBalances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [realRes, demoRes, institutionalRes] = await Promise.all([
        fetch('/api/user/financial?balanceType=REAL'),
        fetch('/api/user/financial?balanceType=DEMO'),
        fetch('/api/user/financial?balanceType=INSTITUTIONAL')
      ]);

      if (realRes.status === 401 || demoRes.status === 401 || institutionalRes.status === 401) {
        setError('Sign in to view balances.');
        setFinancialReal(null);
        setFinancialDemo(null);
        setFinancialInstitutional(null);
        return;
      }

      if (!realRes.ok || !demoRes.ok || !institutionalRes.ok) {
        throw new Error('Failed to load balances');
      }

      const [real, demo, institutional] = await Promise.all([
        realRes.json() as Promise<FinancialSnapshot>,
        demoRes.json() as Promise<FinancialSnapshot>,
        institutionalRes.json() as Promise<FinancialSnapshot>
      ]);

      setFinancialReal(real);
      setFinancialDemo(demo);
      setFinancialInstitutional(institutional);
    } catch {
      setError('Could not load account balances.');
      setFinancialReal(null);
      setFinancialDemo(null);
      setFinancialInstitutional(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBalances();
  }, [loadBalances]);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  const showCards =
    financialReal && financialDemo && financialInstitutional && !error;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[var(--trade-border)] bg-[var(--trade-panel)] px-6">
        <h1 className="text-base font-semibold text-[var(--trade-text)]">
          Dashboard
        </h1>
        <ModeToggle />
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            {error && (
              <p className="text-sm text-[var(--trade-red)]">{error}</p>
            )}
            {loading && !showCards ? (
              <BalanceCardsSkeleton />
            ) : showCards ? (
              <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <AccountBalanceRow
                  financial={financialReal}
                  accountLabel="Real"
                  ghost="REAL"
                />
                <AccountBalanceRow
                  financial={financialDemo}
                  accountLabel="Demo"
                  ghost="DEMO"
                />
                <AccountBalanceRow
                  financial={financialInstitutional}
                  accountLabel="Institutional"
                  ghost="INST"
                />
              </div>
            ) : null}
          </div>
          <Link
            href="/user-management/settings"
            className="shrink-0 text-sm font-medium text-[var(--trade-accent-blue)] hover:underline"
          >
            Account settings &gt;
          </Link>
        </div>

        <section className="rounded-xl border border-[var(--trade-border)] bg-[var(--trade-panel)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--trade-border)] px-4 py-3">
            <h2 className="text-sm font-semibold text-[var(--trade-text)]">
              Transaction history
            </h2>
            <Link
              href="/user-management/transaction-history"
              className="rounded-full bg-[var(--trade-border)]/50 px-3 py-1 text-xs font-medium text-[var(--trade-text)] hover:bg-[var(--trade-border)]"
            >
              View all &gt;
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
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Wallet</th>
                  <th className="px-4 py-3 font-medium">Date</th>
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
                        Loading transactions…
                      </span>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-[var(--trade-text-muted)]"
                    >
                      No recent deposits or withdrawals on your real wallet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[var(--trade-border)]/80 last:border-0"
                    >
                      <td className="px-4 py-3 text-[var(--trade-text)]">
                        {txTypeLabel(row.type)}
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
                        {walletLabel(row.balanceType)}
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

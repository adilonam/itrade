'use client';

import { useCallback, useEffect, useState } from 'react';
import { IconRefresh } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type { BalanceType } from '@/lib/prisma/generated/client';

type TransferTxType = 'TRANSFER_IN' | 'TRANSFER_OUT';

type TransferTransactionRow = {
  id: string;
  type: TransferTxType;
  absoluteAmount: number;
  description: string | null;
  createdAt: string;
  balanceType: BalanceType;
};

function fmtUsd(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n);
}

type Props = {
  refreshKey?: number;
};

export function BalanceTransferTransactionsList({ refreshKey = 0 }: Props) {
  const t = useTranslations('UserManagement.transfer');
  const [rows, setRows] = useState<TransferTransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        types: 'TRANSFER_IN,TRANSFER_OUT',
        balanceTypes: 'REAL,INSTITUTIONAL',
        limit: '50',
        page: '1'
      });
      const res = await fetch(`/api/user/transactions?${params.toString()}`);
      if (res.status === 401) {
        setRows([]);
        setError(t('signInTransfers'));
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to load transactions');
      }
      const json = (await res.json()) as {
        transactions?: TransferTransactionRow[];
      };
      setRows(json.transactions ?? []);
    } catch {
      setError(t('loadTransfersError'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <section className="rounded-xl border border-[var(--trade-border)] bg-[var(--trade-panel)] p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--trade-text)]">
            {t('transferActivity')}
          </h2>
          <p className="mt-1 text-xs text-[var(--trade-text-muted)]">
            {t('transferActivityHint')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)] px-3 py-2 text-xs font-medium text-[var(--trade-text)] hover:bg-[var(--trade-border)]/40 disabled:opacity-50"
        >
          <IconRefresh
            className={cn('size-3.5', loading && 'animate-spin')}
            stroke={2}
          />
          {t('refresh')}
        </button>
      </div>

      {error && (
        <p className="mt-4 text-sm text-[var(--trade-red)]">{error}</p>
      )}

      {loading ? (
        <div className="mt-4 h-[72px] animate-pulse rounded-lg bg-[var(--trade-border)]/60" />
      ) : rows.length === 0 && !error ? (
        <p className="mt-4 rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)] px-4 py-3 text-sm text-[var(--trade-text-muted)]">
          {t('noTransfers')}
        </p>
      ) : rows.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-lg border border-[var(--trade-border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--trade-dark)] text-[var(--trade-text-muted)]">
              <tr>
                <th className="px-4 py-2.5 font-medium">{t('tableDate')}</th>
                <th className="px-4 py-2.5 font-medium">{t('tableType')}</th>
                <th className="px-4 py-2.5 font-medium">{t('tableWallet')}</th>
                <th className="px-4 py-2.5 font-medium">{t('tableAmount')}</th>
                <th className="px-4 py-2.5 font-medium">{t('tableNote')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--trade-border)] bg-[var(--trade-panel)]">
              {rows.map((tx) => (
                <tr key={tx.id}>
                  <td className="px-4 py-2.5 text-xs text-[var(--trade-text-muted)]">
                    {new Date(tx.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        'text-xs font-semibold',
                        tx.type === 'TRANSFER_IN'
                          ? 'text-[var(--trade-green)]'
                          : 'text-amber-600 dark:text-amber-400'
                      )}
                    >
                      {tx.type === 'TRANSFER_IN' ? t('transferIn') : t('transferOut')}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-[var(--trade-text)]">
                    {tx.balanceType}
                  </td>
                  <td className="px-4 py-2.5 font-mono font-semibold tabular-nums text-[var(--trade-text)]">
                    {fmtUsd(tx.absoluteAmount)}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-2.5 text-xs text-[var(--trade-text-muted)]">
                    {tx.description?.trim() || '—'}
                  </td>
              </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

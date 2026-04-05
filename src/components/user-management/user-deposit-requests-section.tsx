'use client';

import { useCallback, useEffect, useState } from 'react';
import { IconExternalLink, IconLoader2 } from '@tabler/icons-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type DepositRequestRow = {
  id: string;
  amountUsd: number;
  payCurrency: string;
  channel: 'GATEWAY' | 'MANUAL';
  status: string;
  orderId: string;
  checkoutUrl: string | null;
  creditedAt: string | null;
  createdAt: string;
  balanceType: string;
};

const STATUSES = [
  'PENDING',
  'WAITING',
  'CONFIRMING',
  'FINISHED',
  'FAILED',
  'EXPIRED',
  'REFUNDED'
] as const;

function statusStyles(s: string) {
  switch (s) {
    case 'PENDING':
    case 'WAITING':
      return 'bg-[var(--trade-text-muted)]/20 text-[var(--trade-text-muted)]';
    case 'FAILED':
    case 'EXPIRED':
    case 'REFUNDED':
      return 'bg-[var(--trade-red)]/15 text-[var(--trade-red)]';
    case 'CONFIRMING':
      return 'bg-[var(--trade-accent-blue)]/15 text-[var(--trade-accent-blue)]';
    case 'FINISHED':
      return 'bg-[var(--trade-green)]/15 text-[var(--trade-green)]';
    default:
      return 'bg-[var(--trade-text-muted)]/20 text-[var(--trade-text-muted)]';
  }
}

function channelLabel(c: string) {
  return c === 'MANUAL' ? 'Manual USDT' : 'NOWPayments';
}

type Props = {
  refreshKey?: number;
};

export function UserDepositRequestsSection({ refreshKey = 0 }: Props) {
  const [requests, setRequests] = useState<DepositRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (channelFilter) params.set('channel', channelFilter);
      const res = await fetch(`/api/user/deposit-requests?${params.toString()}`);
      if (res.status === 401) {
        setRequests([]);
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch');
      const data = (await res.json()) as { requests?: DepositRequestRow[] };
      setRequests(data.requests ?? []);
    } catch {
      toast.error('Could not load your deposit requests');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, channelFilter]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests, refreshKey]);

  const showPayLink = (r: DepositRequestRow) =>
    r.channel === 'GATEWAY' &&
    r.checkoutUrl &&
    ['PENDING', 'WAITING', 'CONFIRMING'].includes(r.status);

  return (
    <section
      className="rounded-xl border border-[var(--trade-border)] bg-[var(--trade-panel)] p-6 shadow-sm"
      aria-labelledby="deposit-requests-heading"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h2
            id="deposit-requests-heading"
            className="text-sm font-semibold text-[var(--trade-text)]"
          >
            Your deposit requests
          </h2>
          <p className="mt-1 text-xs text-[var(--trade-text-muted)]">
            Track gateway and manual USDT deposits. Open payment again if a
            link is still valid.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-[var(--trade-text-muted)]">
              Channel
            </span>
            <select
              value={channelFilter || 'all'}
              onChange={(e) =>
                setChannelFilter(e.target.value === 'all' ? '' : e.target.value)
              }
              className={cn(
                'rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)] px-3 py-2 text-sm text-[var(--trade-text)] outline-none',
                'focus:border-[var(--trade-accent-blue)] focus:ring-2 focus:ring-[var(--trade-accent-blue)]/25'
              )}
            >
              <option value="all">All</option>
              <option value="GATEWAY">NOWPayments</option>
              <option value="MANUAL">Manual USDT</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-[var(--trade-text-muted)]">
              Status
            </span>
            <select
              value={statusFilter || 'all'}
              onChange={(e) =>
                setStatusFilter(e.target.value === 'all' ? '' : e.target.value)
              }
              className={cn(
                'rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)] px-3 py-2 text-sm text-[var(--trade-text)] outline-none',
                'focus:border-[var(--trade-accent-blue)] focus:ring-2 focus:ring-[var(--trade-accent-blue)]/25'
              )}
            >
              <option value="all">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-6">
        {loading && requests.length === 0 ? (
          <div className="flex justify-center py-12">
            <IconLoader2 className="size-8 animate-spin text-[var(--trade-text-muted)]" />
          </div>
        ) : requests.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--trade-text-muted)]">
            No deposit requests yet. Complete a deposit above to see it here.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[var(--trade-border)]">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--trade-border)] bg-[var(--trade-dark)]">
                  <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-[var(--trade-text-muted)]">
                    Date
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-[var(--trade-text-muted)]">
                    Wallet
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-[var(--trade-text-muted)]">
                    Channel
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-[var(--trade-text-muted)]">
                    Amount
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-[var(--trade-text-muted)]">
                    Asset
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-[var(--trade-text-muted)]">
                    Order
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-[var(--trade-text-muted)]">
                    Status
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-[var(--trade-text-muted)]">
                    Credited
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-[var(--trade-text-muted)]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[var(--trade-border)]/80 last:border-0"
                  >
                    <td className="px-3 py-2.5 text-xs text-[var(--trade-text-muted)]">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-[var(--trade-text)]">
                      {r.balanceType}
                    </td>
                    <td className="px-3 py-2.5 text-[var(--trade-text)]">
                      {channelLabel(r.channel)}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-medium tabular-nums text-[var(--trade-text)]">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(r.amountUsd)}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs uppercase text-[var(--trade-text)]">
                      {r.payCurrency}
                    </td>
                    <td
                      className="max-w-[120px] truncate px-3 py-2.5 font-mono text-xs text-[var(--trade-text-muted)]"
                      title={r.orderId}
                    >
                      {r.orderId}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          'inline-flex rounded-md px-2 py-0.5 text-xs font-medium',
                          statusStyles(r.status)
                        )}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-[var(--trade-text-muted)]">
                      {r.creditedAt
                        ? new Date(r.creditedAt).toLocaleString()
                        : '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      {showPayLink(r) ? (
                        <a
                          href={r.checkoutUrl!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--trade-accent-blue)] hover:underline"
                        >
                          Pay
                          <IconExternalLink className="size-3.5" stroke={2} />
                        </a>
                      ) : (
                        <span className="text-xs text-[var(--trade-text-muted)]">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

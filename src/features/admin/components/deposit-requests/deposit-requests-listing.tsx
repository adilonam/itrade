'use client';

import {
  useState,
  useEffect,
  useCallback,
  type CSSProperties
} from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { IconLoader2 } from '@tabler/icons-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TRADE_ROOM_CARD_CLASS } from '@/constants/trade-room-ui';

type DepositRequestRow = {
  id: string;
  amountUsd: number;
  payCurrency: string;
  channel: 'GATEWAY' | 'MANUAL';
  status: string;
  orderId: string;
  checkoutUrl: string | null;
  creditedAt: string | null;
  adminNotes: string | null;
  createdAt: string;
  userBalance: {
    type: string;
    user: { id: string; name: string | null; email: string };
  };
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

const depositTableCardClass = cn(
  'flex max-h-[min(70vh,520px)] flex-col overflow-hidden',
  TRADE_ROOM_CARD_CLASS
);

/** Trigger: override Select default `dark:bg-input/30` (translucent) in dark mode. */
const selectSurfaceClass = cn(
  'border-[var(--trade-border)] text-sm text-[var(--trade-text)]',
  '!bg-[var(--trade-dark)] dark:!bg-[var(--trade-dark)]',
  'hover:!bg-[var(--trade-panel)] dark:hover:!bg-[var(--trade-panel)]'
);

/** Menu: darker than page `--trade-dark`; viewport inherits via select.tsx. */
const selectContentClass = cn(
  'z-[300] max-h-[min(280px,50vh)] border border-[var(--trade-border)]',
  '!bg-[color:var(--trade-select-menu,#05070b)] text-[var(--trade-text)] shadow-2xl'
);

const selectContentStyle: CSSProperties = {
  backgroundColor: 'var(--trade-select-menu, #05070b)'
};

const selectItemTradeClass = cn(
  'text-[var(--trade-text)] cursor-pointer outline-none',
  '!bg-transparent dark:!bg-transparent',
  'data-[highlighted]:!bg-[var(--trade-dark)] dark:data-[highlighted]:!bg-[var(--trade-dark)]',
  'data-[highlighted]:!text-[var(--trade-text)]',
  'data-[state=checked]:!bg-[var(--trade-dark)] dark:data-[state=checked]:!bg-[var(--trade-dark)]',
  'focus:!bg-[var(--trade-dark)] dark:focus:!bg-[var(--trade-dark)]'
);

function statusPillClass(s: string) {
  switch (s) {
    case 'PENDING':
    case 'WAITING':
      return 'bg-[var(--trade-border)]/80 text-[var(--trade-text-muted)]';
    case 'CONFIRMING':
      return 'bg-[var(--trade-accent-blue)]/20 text-[var(--trade-accent-blue)]';
    case 'FINISHED':
      return 'bg-[var(--trade-green)]/20 text-[var(--trade-green)]';
    case 'FAILED':
    case 'EXPIRED':
    case 'REFUNDED':
      return 'bg-[var(--trade-red)]/20 text-[var(--trade-red)]';
    default:
      return 'bg-[var(--trade-border)]/80 text-[var(--trade-text-muted)]';
  }
}

function channelLabel(c: string) {
  return c === 'MANUAL' ? 'Manual USDT' : 'NOWPayments';
}

export default function DepositRequestsListing() {
  const [requests, setRequests] = useState<DepositRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/deposit-requests');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = (await res.json()) as { requests?: DepositRequestRow[] };
      setRequests(data.requests ?? []);
    } catch {
      toast.error('Failed to load deposit requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/deposit-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? 'Update failed');
      }
      toast.success('Status updated');
      loadRequests();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading && requests.length === 0) {
    return (
      <Card className={depositTableCardClass}>
        <CardContent className='flex flex-col items-center justify-center px-4 py-12 text-xs text-[var(--trade-text-muted)]'>
          <IconLoader2 className='mb-4 h-6 w-6 animate-spin text-[var(--trade-text-muted)]' />
          <p className='text-center'>Loading deposit requests…</p>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className={depositTableCardClass}>
        <CardContent className='flex flex-col items-center justify-center px-4 py-12 text-xs text-[var(--trade-text-muted)]'>
          <p className='text-center'>No deposit requests found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={depositTableCardClass}>
      <CardContent className='min-h-[240px] min-w-0 flex-1 overflow-hidden px-4 pb-4 pt-3'>
        <div className='relative flex h-full min-h-[200px] flex-col'>
          <div className='relative flex min-h-0 min-w-0 flex-1'>
            <div className='absolute inset-0 min-h-0 min-w-0 overflow-auto rounded-md border border-[var(--trade-border)] bg-[var(--trade-dark)]/20'>
              <Table className='min-w-[1040px] text-xs text-[var(--trade-text)] [&_td]:text-[var(--trade-text)]'>
                <TableHeader
                  className={cn(
                    'sticky top-0 z-10',
                    'border-b border-[var(--trade-border)] bg-[var(--trade-panel)]',
                    '[&_th]:h-9 [&_th]:px-2 [&_th]:text-left [&_th]:text-[10px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-[var(--trade-text-muted)]'
                  )}
                >
                  <TableRow className='border-[var(--trade-border)] hover:bg-transparent'>
                    <TableHead className='whitespace-nowrap'>Date</TableHead>
                    <TableHead className='whitespace-nowrap'>User</TableHead>
                    <TableHead className='whitespace-nowrap'>Channel</TableHead>
                    <TableHead className='whitespace-nowrap'>
                      Amount (USD)
                    </TableHead>
                    <TableHead className='whitespace-nowrap'>Asset</TableHead>
                    <TableHead className='whitespace-nowrap'>Order</TableHead>
                    <TableHead className='whitespace-nowrap'>Status</TableHead>
                    <TableHead className='whitespace-nowrap'>Credited</TableHead>
                    <TableHead className='min-w-[168px] whitespace-nowrap text-right'>
                      Change status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className='[&_tr]:border-[var(--trade-border)]/70'>
                  {requests.map((r) => (
                    <TableRow
                      key={r.id}
                      className='border-[var(--trade-border)]/80 hover:bg-[var(--trade-dark)]/40'
                    >
                      <TableCell className='px-2 py-2.5 text-[var(--trade-text-muted)]'>
                        {new Date(r.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className='px-2 py-2.5'>
                        <div>
                          <div className='font-medium text-[var(--trade-text)]'>
                            {r.userBalance.user.name ||
                              r.userBalance.user.email}
                          </div>
                          <div className='text-[var(--trade-text-muted)]'>
                            {r.userBalance.user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className='px-2 py-2.5 text-[var(--trade-text)]'>
                        {channelLabel(r.channel)}
                      </TableCell>
                      <TableCell className='px-2 py-2.5 font-medium tabular-nums text-[var(--trade-text)]'>
                        ${r.amountUsd.toFixed(2)}
                      </TableCell>
                      <TableCell className='px-2 py-2.5 font-mono uppercase text-[var(--trade-text)]'>
                        {r.payCurrency}
                      </TableCell>
                      <TableCell
                        className='max-w-[160px] truncate px-2 py-2.5 font-mono text-[var(--trade-text-muted)]'
                        title={r.orderId}
                      >
                        {r.orderId}
                      </TableCell>
                      <TableCell className='px-2 py-2.5'>
                        <span
                          className={cn(
                            'inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold',
                            statusPillClass(r.status)
                          )}
                        >
                          {r.status}
                        </span>
                      </TableCell>
                      <TableCell className='px-2 py-2.5 text-[var(--trade-text-muted)]'>
                        {r.creditedAt
                          ? new Date(r.creditedAt).toLocaleString()
                          : '—'}
                      </TableCell>
                      <TableCell className='px-2 py-2.5 text-right'>
                        <Select
                          value={r.status}
                          onValueChange={(v) => updateStatus(r.id, v)}
                          disabled={updatingId === r.id}
                        >
                          <SelectTrigger
                            size='sm'
                            className={cn(
                              'ml-auto h-8 w-full min-w-[140px]',
                              selectSurfaceClass
                            )}
                          >
                            {updatingId === r.id ? (
                              <IconLoader2 className='h-4 w-4 animate-spin' />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent
                            className={selectContentClass}
                            style={selectContentStyle}
                          >
                            {STATUSES.map((s) => (
                              <SelectItem
                                key={s}
                                value={s}
                                className={selectItemTradeClass}
                              >
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

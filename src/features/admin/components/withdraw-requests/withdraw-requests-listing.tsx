'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconLoader2, IconRefresh } from '@tabler/icons-react';
import { toast } from 'sonner';
import { TRADE_ROOM_CARD_CLASS } from '@/constants/trade-room-ui';

type WithdrawRequestRow = {
  id: string;
  amount: number;
  method: string;
  status: string;
  details: unknown;
  adminNotes: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
};

const STATUSES = ['PENDING', 'REJECTED', 'PROCESSING', 'APPROVED'] as const;

function methodLabel(m: string) {
  return m === 'PAYPAL' ? 'PayPal' : 'Bank transfer';
}

const selectTriggerClass =
  'h-8 border-[var(--trade-border)] bg-[var(--trade-dark)] text-xs text-[var(--trade-text)] focus-visible:border-[var(--trade-accent-blue)] focus-visible:ring-[var(--trade-accent-blue)]/25';

const selectContentClass =
  'border-[var(--trade-border)] bg-[var(--trade-panel)] text-[var(--trade-text)]';

function withdrawStatusBadgeClass(s: string) {
  switch (s) {
    case 'PENDING':
      return 'border-[var(--trade-accent-blue)]/40 bg-[var(--trade-accent-blue)]/15 text-[var(--trade-accent-blue)]';
    case 'REJECTED':
      return 'border-[var(--trade-red)]/40 bg-[var(--trade-red)]/15 text-[var(--trade-red)]';
    case 'PROCESSING':
      return 'border-amber-400/40 bg-amber-400/15 text-amber-400';
    case 'APPROVED':
      return 'border-[var(--trade-green)]/40 bg-[var(--trade-green)]/15 text-[var(--trade-green)]';
    default:
      return 'border-[var(--trade-border)] bg-[var(--trade-dark)] text-[var(--trade-text-muted)]';
  }
}

function formatDetails(method: string, details: unknown): string {
  if (!details || typeof details !== 'object') return '—';
  const d = details as Record<string, unknown>;
  if (method === 'PAYPAL') {
    const email = d.email;
    return typeof email === 'string' ? email : '—';
  }
  if (method === 'BANK_TRANSFER') {
    const parts: string[] = [];
    if (typeof d.accountHolderName === 'string')
      parts.push(d.accountHolderName);
    if (typeof d.bankName === 'string') parts.push(d.bankName);
    if (typeof d.accountNumber === 'string' && d.accountNumber.length >= 4)
      parts.push(`••••${d.accountNumber.slice(-4)}`);
    if (typeof d.routingNumber === 'string')
      parts.push(`Routing: ${d.routingNumber}`);
    return parts.length ? parts.join(' · ') : '—';
  }
  return '—';
}

export default function WithdrawRequestsListing() {
  const [requests, setRequests] = useState<WithdrawRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(
        `/api/admin/withdraw-requests?${params.toString()}`
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setRequests(data.requests ?? []);
    } catch {
      toast.error('Failed to load withdraw requests');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/withdraw-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
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
      <Card className={TRADE_ROOM_CARD_CLASS}>
        <CardHeader className='px-4 pb-0 pt-0'>
          <CardTitle className='text-sm font-semibold'>
            Withdraw requests
          </CardTitle>
          <CardDescription className='text-xs text-[var(--trade-text-muted)]'>
            Loading…
          </CardDescription>
        </CardHeader>
        <CardContent className='px-4'>
          <div className='flex items-center justify-center py-8'>
            <div className='h-8 w-8 animate-spin rounded-full border-2 border-[var(--trade-border)] border-b-[var(--trade-accent-blue)]' />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={TRADE_ROOM_CARD_CLASS}>
      <CardHeader className='px-4 pb-0 pt-0'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div>
            <CardTitle className='text-sm font-semibold'>
              Withdraw requests
            </CardTitle>
            <CardDescription className='text-xs text-[var(--trade-text-muted)]'>
              Filter by status and update each request. Rejected requests are
              refunded automatically.
            </CardDescription>
          </div>
          <div className='flex flex-wrap items-center gap-3'>
            <div className='flex items-center gap-2'>
              <span className='text-xs text-[var(--trade-text-muted)]'>
                Status
              </span>
              <Select
                value={statusFilter || 'all'}
                onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}
              >
                <SelectTrigger
                  id='status-filter'
                  className={`w-[140px] ${selectTriggerClass}`}
                >
                  <SelectValue placeholder='All' />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  <SelectItem value='all'>All</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='border-[var(--trade-border)] bg-[var(--trade-panel)] text-[var(--trade-text)] hover:bg-[var(--trade-border)]'
              onClick={() => void loadRequests()}
              disabled={loading}
            >
              <IconRefresh
                className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className='px-4'>
        {requests.length === 0 ? (
          <div className='py-8 text-center text-xs text-[var(--trade-text-muted)]'>
            No withdraw requests found.
          </div>
        ) : (
          <div className='relative flex min-h-[320px] flex-col'>
            <div className='relative flex flex-1'>
              <div className='absolute inset-0 flex overflow-hidden rounded-lg border border-[var(--trade-border)]'>
                <ScrollArea className='h-full w-full' horizontal>
                  <Table>
                    <TableHeader className='sticky top-0 z-10 border-b border-[var(--trade-border)] bg-[var(--trade-dark)]/80'>
                      <TableRow className='border-[var(--trade-border)] hover:bg-transparent'>
                        <TableHead className='text-xs font-medium text-[var(--trade-text-muted)]'>
                          Date
                        </TableHead>
                        <TableHead className='text-xs font-medium text-[var(--trade-text-muted)]'>
                          User
                        </TableHead>
                        <TableHead className='text-xs font-medium text-[var(--trade-text-muted)]'>
                          Amount
                        </TableHead>
                        <TableHead className='text-xs font-medium text-[var(--trade-text-muted)]'>
                          Method
                        </TableHead>
                        <TableHead className='text-xs font-medium text-[var(--trade-text-muted)]'>
                          Details
                        </TableHead>
                        <TableHead className='text-xs font-medium text-[var(--trade-text-muted)]'>
                          Status
                        </TableHead>
                        <TableHead className='w-[180px] text-xs font-medium text-[var(--trade-text-muted)]'>
                          Change status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((r) => (
                        <TableRow
                          key={r.id}
                          className='border-[var(--trade-border)] hover:bg-[var(--trade-dark)]/30'
                        >
                          <TableCell className='text-xs text-[var(--trade-text-muted)]'>
                            {new Date(r.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className='text-[var(--trade-text)]'>
                            <div>
                              <div className='text-sm font-medium'>
                                {r.user.name || r.user.email}
                              </div>
                              <div className='text-xs text-[var(--trade-text-muted)]'>
                                {r.user.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className='font-mono text-sm text-[var(--trade-text)]'>
                            ${r.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className='text-sm text-[var(--trade-text)]'>
                            {methodLabel(r.method)}
                          </TableCell>
                          <TableCell
                            className='max-w-[220px] truncate text-xs text-[var(--trade-text-muted)]'
                            title={formatDetails(r.method, r.details)}
                          >
                            {formatDetails(r.method, r.details)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={withdrawStatusBadgeClass(r.status)}
                            >
                              {r.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={r.status}
                              onValueChange={(v) => updateStatus(r.id, v)}
                              disabled={updatingId === r.id}
                            >
                              <SelectTrigger
                                className={`w-[130px] ${selectTriggerClass}`}
                              >
                                {updatingId === r.id ? (
                                  <IconLoader2 className='h-4 w-4 animate-spin' />
                                ) : (
                                  <SelectValue />
                                )}
                              </SelectTrigger>
                              <SelectContent className={selectContentClass}>
                                {STATUSES.map((s) => (
                                  <SelectItem key={s} value={s}>
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
                </ScrollArea>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

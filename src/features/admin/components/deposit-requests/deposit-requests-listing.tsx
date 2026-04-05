'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconLoader2 } from '@tabler/icons-react';
import { toast } from 'sonner';

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

function statusVariant(s: string) {
  switch (s) {
    case 'PENDING':
    case 'WAITING':
      return 'secondary';
    case 'FAILED':
    case 'EXPIRED':
    case 'REFUNDED':
      return 'destructive';
    case 'CONFIRMING':
      return 'default';
    case 'FINISHED':
      return 'outline';
    default:
      return 'secondary';
  }
}

function channelLabel(c: string) {
  return c === 'MANUAL' ? 'Manual USDT' : 'NOWPayments';
}

export default function DepositRequestsListing() {
  const [requests, setRequests] = useState<DepositRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [channelFilter, setChannelFilter] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (channelFilter) params.set('channel', channelFilter);
      const res = await fetch(
        `/api/admin/deposit-requests?${params.toString()}`
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const data = (await res.json()) as { requests?: DepositRequestRow[] };
      setRequests(data.requests ?? []);
    } catch {
      toast.error('Failed to load deposit requests');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, channelFilter]);

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
      <Card>
        <CardContent className='flex items-center justify-center py-12'>
          <IconLoader2 className='text-muted-foreground h-8 w-8 animate-spin' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <CardTitle>Deposit requests</CardTitle>
          <div className='flex flex-wrap items-center gap-4'>
            <div className='flex items-center gap-2'>
              <Label htmlFor='channel-filter' className='text-sm'>
                Channel
              </Label>
              <Select
                value={channelFilter || 'all'}
                onValueChange={(v) =>
                  setChannelFilter(v === 'all' ? '' : v)
                }
              >
                <SelectTrigger id='channel-filter' className='w-[150px]'>
                  <SelectValue placeholder='All' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All</SelectItem>
                  <SelectItem value='GATEWAY'>NOWPayments</SelectItem>
                  <SelectItem value='MANUAL'>Manual USDT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='flex items-center gap-2'>
              <Label htmlFor='dep-status-filter' className='text-sm'>
                Status
              </Label>
              <Select
                value={statusFilter || 'all'}
                onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}
              >
                <SelectTrigger id='dep-status-filter' className='w-[160px]'>
                  <SelectValue placeholder='All' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className='text-muted-foreground py-8 text-center text-sm'>
            No deposit requests found.
          </p>
        ) : (
          <div className='overflow-x-auto rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/50'>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Amount (USD)</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Credited</TableHead>
                  <TableHead className='w-[180px]'>Change status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className='text-muted-foreground text-xs'>
                      {new Date(r.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className='font-medium'>
                          {r.userBalance.user.name ||
                            r.userBalance.user.email}
                        </div>
                        <div className='text-muted-foreground text-xs'>
                          {r.userBalance.user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className='text-sm'>
                      {channelLabel(r.channel)}
                    </TableCell>
                    <TableCell className='font-medium'>
                      ${r.amountUsd.toFixed(2)}
                    </TableCell>
                    <TableCell className='font-mono text-xs uppercase'>
                      {r.payCurrency}
                    </TableCell>
                    <TableCell
                      className='text-muted-foreground max-w-[140px] truncate font-mono text-xs'
                      title={r.orderId}
                    >
                      {r.orderId}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(r.status)}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-xs'>
                      {r.creditedAt
                        ? new Date(r.creditedAt).toLocaleString()
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={r.status}
                        onValueChange={(v) => updateStatus(r.id, v)}
                        disabled={updatingId === r.id}
                      >
                        <SelectTrigger className='h-8 w-[150px]'>
                          {updatingId === r.id ? (
                            <IconLoader2 className='h-4 w-4 animate-spin' />
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}

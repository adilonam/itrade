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

function statusVariant(s: string) {
  switch (s) {
    case 'PENDING':
      return 'secondary';
    case 'REJECTED':
      return 'destructive';
    case 'PROCESSING':
      return 'default';
    case 'APPROVED':
      return 'outline';
    default:
      return 'secondary';
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
          <CardTitle>Withdraw requests</CardTitle>
          <div className='flex items-center gap-2'>
            <Label htmlFor='status-filter' className='text-sm'>
              Status
            </Label>
            <Select
              value={statusFilter || 'all'}
              onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}
            >
              <SelectTrigger id='status-filter' className='w-[140px]'>
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
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className='text-muted-foreground py-8 text-center text-sm'>
            No withdraw requests found.
          </p>
        ) : (
          <div className='overflow-x-auto rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/50'>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Status</TableHead>
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
                          {r.user.name || r.user.email}
                        </div>
                        <div className='text-muted-foreground text-xs'>
                          {r.user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className='font-medium'>
                      ${r.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>{methodLabel(r.method)}</TableCell>
                    <TableCell
                      className='text-muted-foreground max-w-[220px] truncate text-xs'
                      title={formatDetails(r.method, r.details)}
                    >
                      {formatDetails(r.method, r.details)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(r.status)}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={r.status}
                        onValueChange={(v) => updateStatus(r.id, v)}
                        disabled={updatingId === r.id}
                      >
                        <SelectTrigger className='h-8 w-[130px]'>
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

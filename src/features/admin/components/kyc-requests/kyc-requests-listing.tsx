'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { IconLoader2 } from '@tabler/icons-react';
import { toast } from 'sonner';

type KycDocument = {
  id: string;
  kind: 'FRONT' | 'BACK' | 'SELFIE' | 'UTILITY_BILL';
  fileUrl: string;
};

type KycRequestRow = {
  id: string;
  documentType: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'REJECTED';
  createdAt: string;
  user: { id: string; name: string | null; email: string };
  documents: KycDocument[];
};

const STATUSES = ['PENDING', 'IN_PROGRESS', 'VERIFIED', 'REJECTED'] as const;

function statusVariant(status: KycRequestRow['status']) {
  switch (status) {
    case 'VERIFIED':
      return 'outline';
    case 'REJECTED':
      return 'destructive';
    case 'IN_PROGRESS':
      return 'default';
    default:
      return 'secondary';
  }
}

function docTypeLabel(value: string) {
  switch (value) {
    case 'passport':
      return 'Passport';
    case 'national_id':
      return 'National ID';
    case 'drivers_license':
      return 'Driver license';
    default:
      return value;
  }
}

function docKindLabel(value: KycDocument['kind']) {
  switch (value) {
    case 'UTILITY_BILL':
      return 'Utility bill';
    default:
      return value.toLowerCase();
  }
}

export default function KycRequestsListing() {
  const [requests, setRequests] = useState<KycRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/kyc-requests?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setRequests(data.requests ?? []);
    } catch {
      toast.error('Failed to load KYC requests');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const markStatus = async (
    id: string,
    status: 'IN_PROGRESS' | 'VERIFIED'
  ) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/kyc-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Update failed');
      }
      toast.success('Request updated');
      await loadRequests();
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
          <CardTitle>KYC requests</CardTitle>
          <div className='flex items-center gap-2'>
            <Label htmlFor='kyc-status-filter' className='text-sm'>
              Status
            </Label>
            <Select
              value={statusFilter || 'all'}
              onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}
            >
              <SelectTrigger id='kyc-status-filter' className='w-[160px]'>
                <SelectValue placeholder='All' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All</SelectItem>
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
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
            No KYC requests found.
          </p>
        ) : (
          <div className='overflow-x-auto rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/50'>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Document type</TableHead>
                  <TableHead>Files</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='w-[230px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => {
                  const pending = request.status === 'PENDING';
                  const inProgress = request.status === 'IN_PROGRESS';
                  const verified = request.status === 'VERIFIED';

                  return (
                    <TableRow key={request.id}>
                      <TableCell className='text-muted-foreground text-xs'>
                        {new Date(request.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className='font-medium'>
                            {request.user.name || request.user.email}
                          </div>
                          <div className='text-muted-foreground text-xs'>
                            {request.user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{docTypeLabel(request.documentType)}</TableCell>
                      <TableCell>
                        <div className='flex flex-wrap gap-2'>
                          {request.documents.map((doc) => (
                            <a
                              key={doc.id}
                              href={doc.fileUrl}
                              target='_blank'
                              rel='noreferrer'
                              className='text-xs text-blue-600 underline underline-offset-2'
                            >
                              {docKindLabel(doc.kind)}
                            </a>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className='flex gap-2'>
                          <Button
                            size='sm'
                            variant='outline'
                            disabled={
                              updatingId === request.id || !pending || verified
                            }
                            onClick={() =>
                              void markStatus(request.id, 'IN_PROGRESS')
                            }
                          >
                            {updatingId === request.id && inProgress ? (
                              <IconLoader2 className='mr-1 h-4 w-4 animate-spin' />
                            ) : null}
                            In progress
                          </Button>
                          <Button
                            size='sm'
                            disabled={updatingId === request.id || verified}
                            onClick={() => void markStatus(request.id, 'VERIFIED')}
                          >
                            {updatingId === request.id && !inProgress ? (
                              <IconLoader2 className='mr-1 h-4 w-4 animate-spin' />
                            ) : null}
                            Verify
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
import {
  KycRequestStatusSelect,
  KYC_REQUEST_ROW_STATUSES,
  kycRequestRowStatusLabel,
  type KycRequestRowStatus
} from '@/features/admin/components/kyc-requests/kyc-request-status-select';

type KycDocument = {
  id: string;
  kind: 'FRONT' | 'BACK' | 'SELFIE' | 'UTILITY_BILL';
};

type KycRequestRow = {
  id: string;
  documentType: string;
  status: KycRequestRowStatus;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
  documents: KycDocument[];
};

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

  const markStatus = async (id: string, status: KycRequestRowStatus) => {
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
                {KYC_REQUEST_ROW_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {kycRequestRowStatusLabel(status)}
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
                  <TableHead className='min-w-[200px]'>Set status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => {
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
                              href={`/api/admin/kyc-documents/${doc.id}`}
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
                          {kycRequestRowStatusLabel(request.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <KycRequestStatusSelect
                          requestId={request.id}
                          value={request.status}
                          updating={updatingId === request.id}
                          onChange={(id, next) => void markStatus(id, next)}
                        />
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

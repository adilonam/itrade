'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
  PositionsTable,
  type PositionWithRelations
} from '@/components/admin/positions/positions-table';
import { TRADE_ROOM_CARD_CLASS } from '@/constants/trade-room-ui';
import type { KycStatus } from '@/lib/prisma/generated/client';
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

function kycAccountStatusLabel(status: KycStatus) {
  return status.replace(/_/g, ' ');
}

type AdminUserKycPositionsSectionProps = {
  userId: string;
  kycStatus: KycStatus;
};

export function AdminUserKycPositionsSection({
  userId,
  kycStatus
}: AdminUserKycPositionsSectionProps) {
  const [kycLoading, setKycLoading] = useState(true);
  const [kycRequests, setKycRequests] = useState<KycRequestRow[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [positionsLoading, setPositionsLoading] = useState(true);
  const [positions, setPositions] = useState<PositionWithRelations[]>([]);
  const [positionTotal, setPositionTotal] = useState(0);

  const loadKyc = useCallback(async () => {
    try {
      setKycLoading(true);
      const params = new URLSearchParams({ userId });
      const res = await fetch(`/api/admin/kyc-requests?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = (await res.json()) as { requests?: KycRequestRow[] };
      setKycRequests(data.requests ?? []);
    } catch {
      toast.error('Failed to load KYC requests for this user');
    } finally {
      setKycLoading(false);
    }
  }, [userId]);

  const loadPositions = useCallback(async () => {
    try {
      setPositionsLoading(true);
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        userId
      });
      const res = await fetch(`/api/admin/positions?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = (await res.json()) as {
        positions: PositionWithRelations[];
        pagination?: { total: number };
      };
      setPositions(data.positions ?? []);
      setPositionTotal(data.pagination?.total ?? 0);
    } catch {
      toast.error('Failed to load positions for this user');
    } finally {
      setPositionsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadKyc();
  }, [loadKyc]);

  useEffect(() => {
    void loadPositions();
  }, [loadPositions]);

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
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? 'Update failed');
      }
      toast.success('Request updated');
      await loadKyc();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className='space-y-6'>
      <Card className={TRADE_ROOM_CARD_CLASS}>
        <CardHeader className='px-4 pb-0 pt-0'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div>
              <CardTitle className='text-sm font-semibold'>
                KYC requests
              </CardTitle>
              <CardDescription className='text-xs text-[var(--trade-text-muted)]'>
                Verification history for this user.{' '}
                <Link
                  href='/admin/kyc-requests'
                  className='text-[var(--trade-accent-blue)] underline underline-offset-2'
                >
                  Open full queue
                </Link>
              </CardDescription>
            </div>
            <Badge variant='outline' className='shrink-0 text-xs font-normal'>
              Account: {kycAccountStatusLabel(kycStatus)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className='px-4'>
          {kycLoading && kycRequests.length === 0 ? (
            <div className='flex justify-center py-10'>
              <IconLoader2 className='h-8 w-8 animate-spin text-[var(--trade-text-muted)]' />
            </div>
          ) : kycRequests.length === 0 ? (
            <p className='py-8 text-center text-xs text-[var(--trade-text-muted)]'>
              No KYC requests submitted for this user yet.
            </p>
          ) : (
            <div className='overflow-x-auto rounded-lg border border-[var(--trade-border)]'>
              <Table>
                <TableHeader className='border-b border-[var(--trade-border)] bg-[var(--trade-dark)]/80'>
                  <TableRow className='border-[var(--trade-border)] hover:bg-transparent'>
                    <TableHead className='text-xs font-medium text-[var(--trade-text-muted)]'>
                      Date
                    </TableHead>
                    <TableHead className='text-xs font-medium text-[var(--trade-text-muted)]'>
                      Document type
                    </TableHead>
                    <TableHead className='text-xs font-medium text-[var(--trade-text-muted)]'>
                      Files
                    </TableHead>
                    <TableHead className='text-xs font-medium text-[var(--trade-text-muted)]'>
                      Status
                    </TableHead>
                    <TableHead className='text-xs font-medium text-[var(--trade-text-muted)]'>
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kycRequests.map((request) => {
                    const pending = request.status === 'PENDING';
                    const inProgress = request.status === 'IN_PROGRESS';
                    const verified = request.status === 'VERIFIED';

                    return (
                      <TableRow
                        key={request.id}
                        className='border-[var(--trade-border)] hover:bg-[var(--trade-dark)]/30'
                      >
                        <TableCell className='text-xs text-[var(--trade-text-muted)]'>
                          {new Date(request.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className='text-sm text-[var(--trade-text)]'>
                          {docTypeLabel(request.documentType)}
                        </TableCell>
                        <TableCell>
                          <div className='flex flex-wrap gap-2'>
                            {request.documents.map((doc) => (
                              <a
                                key={doc.id}
                                href={doc.fileUrl}
                                target='_blank'
                                rel='noreferrer'
                                className='text-xs text-[var(--trade-accent-blue)] underline underline-offset-2'
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
                          <div className='flex flex-wrap gap-2'>
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
                              onClick={() =>
                                void markStatus(request.id, 'VERIFIED')
                              }
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

      <div className='space-y-2'>
        {positionTotal > 50 ? (
          <p className='text-xs text-[var(--trade-text-muted)]'>
            Showing 50 of {positionTotal} positions.{' '}
            <Link
              href='/admin/positions'
              className='text-[var(--trade-accent-blue)] underline underline-offset-2'
            >
              Open Positions
            </Link>{' '}
            to search and manage the full list.
          </p>
        ) : null}
        <PositionsTable
          positions={positions}
          loading={positionsLoading}
          readOnly
          omitUserColumn
          compact
          onEdit={() => {}}
          onDelete={() => {}}
        />
      </div>
    </div>
  );
}

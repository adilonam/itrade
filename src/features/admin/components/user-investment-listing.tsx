'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  AdminUserInvestment,
  fetchAdminUserInvestments,
  revokeAdminUserInvestment
} from '../services/user-investments';
import { toast } from 'sonner';

type InvestmentStatusFilter = 'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function statusBadgeVariant(status: AdminUserInvestment['status']) {
  if (status === 'ACTIVE') return 'default';
  if (status === 'COMPLETED') return 'secondary';
  return 'destructive';
}

export default function UserInvestmentListing() {
  const [items, setItems] = useState<AdminUserInvestment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [userFilterInput, setUserFilterInput] = useState('');
  const [investmentFilterInput, setInvestmentFilterInput] = useState('');
  const [searchFilterInput, setSearchFilterInput] = useState('');
  const [statusFilterInput, setStatusFilterInput] =
    useState<InvestmentStatusFilter>('ALL');

  const [userFilter, setUserFilter] = useState('');
  const [investmentFilter, setInvestmentFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvestmentStatusFilter>('ALL');
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadUserInvestments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetchAdminUserInvestments({
        page,
        limit: pageSize,
        user: userFilter || undefined,
        investment: investmentFilter || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: searchFilter || undefined
      });

      setItems(response.userInvestments);
      setTotal(response.pagination.total);
      setTotalPages(response.pagination.totalPages || 1);
    } catch {
      setError('Failed to load user investments');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, userFilter, investmentFilter, statusFilter, searchFilter]);

  useEffect(() => {
    loadUserInvestments();
  }, [loadUserInvestments]);

  const pageLabel = useMemo(() => `Page ${page} of ${totalPages}`, [page, totalPages]);

  const applyFilters = () => {
    setPage(1);
    setUserFilter(userFilterInput.trim());
    setInvestmentFilter(investmentFilterInput.trim());
    setSearchFilter(searchFilterInput.trim());
    setStatusFilter(statusFilterInput);
  };

  const clearFilters = () => {
    setPage(1);
    setUserFilterInput('');
    setInvestmentFilterInput('');
    setSearchFilterInput('');
    setStatusFilterInput('ALL');
    setUserFilter('');
    setInvestmentFilter('');
    setSearchFilter('');
    setStatusFilter('ALL');
  };

  const handleRevoke = async (item: AdminUserInvestment) => {
    const ok = window.confirm(
      `Revoke this investment for ${item.user.name || item.user.email}?\n\nThe invested amount ${formatCurrency(item.amount)} will be refunded to the user and the enrollment will be deleted.`
    );

    if (!ok) return;

    try {
      setRevokingId(item.id);
      await revokeAdminUserInvestment(item.id);
      toast.success('User investment revoked and refunded');
      await loadUserInvestments();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to revoke user investment'
      );
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Investments</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4'>
          <div className='space-y-1'>
            <Label htmlFor='filter-user'>User</Label>
            <Input
              id='filter-user'
              placeholder='User id, name, email'
              value={userFilterInput}
              onChange={(event) => setUserFilterInput(event.target.value)}
            />
          </div>

          <div className='space-y-1'>
            <Label htmlFor='filter-investment'>Investment</Label>
            <Input
              id='filter-investment'
              placeholder='Investment id or title'
              value={investmentFilterInput}
              onChange={(event) => setInvestmentFilterInput(event.target.value)}
            />
          </div>

          <div className='space-y-1'>
            <Label htmlFor='filter-search'>Enrollment Search</Label>
            <Input
              id='filter-search'
              placeholder='Enrollment id or text'
              value={searchFilterInput}
              onChange={(event) => setSearchFilterInput(event.target.value)}
            />
          </div>

          <div className='space-y-1'>
            <Label htmlFor='filter-status'>Status</Label>
            <Select
              value={statusFilterInput}
              onValueChange={(value: InvestmentStatusFilter) =>
                setStatusFilterInput(value)
              }
            >
              <SelectTrigger id='filter-status'>
                <SelectValue placeholder='All statuses' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>All statuses</SelectItem>
                <SelectItem value='ACTIVE'>Active</SelectItem>
                <SelectItem value='COMPLETED'>Completed</SelectItem>
                <SelectItem value='CANCELLED'>Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Button onClick={applyFilters}>Apply Filters</Button>
          <Button variant='outline' onClick={clearFilters}>
            Reset
          </Button>
          <Button variant='outline' onClick={loadUserInvestments}>
            Refresh
          </Button>
          <div className='text-muted-foreground ml-auto text-sm'>
            Total: {total} user investments
          </div>
        </div>

        <div className='relative flex min-h-[420px] flex-col'>
          <div className='relative flex flex-1'>
            <div className='absolute inset-0 flex overflow-hidden rounded-lg border'>
              <ScrollArea className='h-full w-full' horizontal>
                <Table>
                  <TableHeader className='bg-muted sticky top-0 z-10'>
                    <TableRow>
                      <TableHead>Enrollment ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Investment</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Expected</TableHead>
                      <TableHead>Actual</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!isLoading && items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={11} className='h-24 text-center'>
                          No user investments found.
                        </TableCell>
                      </TableRow>
                    )}

                    {isLoading && (
                      <TableRow>
                        <TableCell colSpan={11} className='h-24 text-center'>
                          Loading user investments...
                        </TableCell>
                      </TableRow>
                    )}

                    {!isLoading &&
                      items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className='font-mono text-xs'>
                            {item.id}
                          </TableCell>
                          <TableCell>
                            <div className='flex flex-col'>
                              <span className='font-medium'>
                                {item.user.name || 'No Name'}
                              </span>
                              <span className='text-muted-foreground text-xs'>
                                {item.user.email}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex flex-col'>
                              <span className='font-medium'>
                                {item.investment.title}
                              </span>
                              <span className='text-muted-foreground text-xs'>
                                {item.investment.id}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(item.amount)}</TableCell>
                          <TableCell>
                            {formatCurrency(item.expectedReturn)}
                          </TableCell>
                          <TableCell>
                            {item.actualReturn == null
                              ? '—'
                              : formatCurrency(item.actualReturn)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadgeVariant(item.status)}>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(item.startDate)}</TableCell>
                          <TableCell>{formatDate(item.endDate)}</TableCell>
                          <TableCell>{formatDate(item.createdAt)}</TableCell>
                          <TableCell>
                            <Button
                              variant='destructive'
                              size='sm'
                              onClick={() => handleRevoke(item)}
                              disabled={
                                item.status !== 'ACTIVE' || revokingId === item.id
                              }
                            >
                              {revokingId === item.id ? 'Revoking...' : 'Revoke'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>
        </div>

        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='text-muted-foreground text-sm'>{pageLabel}</div>

          <div className='flex items-center gap-2'>
            <Label htmlFor='user-investments-page-size'>Rows per page</Label>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPage(1);
                setPageSize(Number(value));
              }}
            >
              <SelectTrigger id='user-investments-page-size' className='w-20'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='10'>10</SelectItem>
                <SelectItem value='20'>20</SelectItem>
                <SelectItem value='50'>50</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant='outline'
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant='outline'
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>

        {error && <p className='text-sm text-red-600'>{error}</p>}
      </CardContent>
    </Card>
  );
}
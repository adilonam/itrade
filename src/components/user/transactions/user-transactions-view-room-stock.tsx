'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserTransactionsTableRoomStock } from './user-transactions-table-room-stock';
import type {
  Transaction,
  TransactionType,
  TransactionStatus,
  Market,
  User
} from '@prisma/client';

// Extended transaction type with relations
type TransactionWithRelations = Transaction & {
  user: User | null;
  market: Market | null;
};

// Transaction filters interface
interface TransactionFilters {
  userId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  room?: string;
  marketId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}
import {
  IconSearch,
  IconFilter,
  IconChevronLeft,
  IconChevronRight,
  IconRefresh
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export function UserTransactionsViewRoomStock() {
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>(
    []
  );
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
    type: undefined,
    status: undefined
  });

  const [currentFilters, setCurrentFilters] = useState<TransactionFilters>({});

  // Load transactions
  const loadTransactions = async (
    page = 1,
    newFilters: TransactionFilters = {}
  ) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });

      // Add filter values, handling Date objects and undefined values
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          if (value instanceof Date) {
            params.set(key, value.toISOString());
          } else {
            params.set(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/user/transactions?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load transactions'
      );
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when filters change
  useEffect(() => {
    loadTransactions(1, currentFilters);
  }, [currentFilters]);

  // Handle filter changes
  const handleFilterChange = (key: keyof TransactionFilters, value: any) => {
    // Convert 'all' to undefined to clear the filter
    const filterValue = value === 'all' ? undefined : value;
    setFilters((prev) => ({ ...prev, [key]: filterValue }));
  };

  const applyFilters = () => {
    setCurrentFilters(filters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({});
    setCurrentFilters({});
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    loadTransactions(newPage, currentFilters);
  };

  // Handle transaction close
  const handleCloseTransaction = async (transactionId: string) => {
    try {
      const response = await fetch(
        `/api/user/transactions/${transactionId}/close`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'CLOSED' })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to close transaction');
      }

      toast.success('Transaction closed successfully');
      loadTransactions(pagination.page, currentFilters);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to close transaction'
      );
    }
  };

  const handleRefresh = () => {
    loadTransactions(pagination.page, currentFilters);
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalTransactions = transactions.length;
    const totalPnL = transactions.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const profitableTransactions = transactions.filter(
      (t) => (t.pnl || 0) > 0
    ).length;
    const losingTransactions = transactions.filter(
      (t) => (t.pnl || 0) < 0
    ).length;

    return {
      totalTransactions,
      totalPnL,
      profitableTransactions,
      losingTransactions
    };
  }, [transactions]);

  return (
    <div className='space-y-6'>
      {/* Summary Cards */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {summaryStats.totalTransactions}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${summaryStats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {summaryStats.totalPnL >= 0 ? '+' : ''}$
              {summaryStats.totalPnL.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Profitable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {summaryStats.profitableTransactions}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Losing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>
              {summaryStats.losingTransactions}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <IconFilter className='h-5 w-5' />
            Filters
          </CardTitle>
          <CardDescription>
            Filter your transactions by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Search</label>
              <div className='relative'>
                <IconSearch className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                <Input
                  placeholder='Search descriptions...'
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium'>Type</label>
              <Select
                value={filters.type || 'all'}
                onValueChange={(value) => handleFilterChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='All types' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All types</SelectItem>
                  <SelectItem value='BUY'>Buy</SelectItem>
                  <SelectItem value='SELL'>Sell</SelectItem>
                  <SelectItem value='DEPOSIT'>Deposit</SelectItem>
                  <SelectItem value='WITHDRAWAL'>Withdrawal</SelectItem>
                  <SelectItem value='TRANSFER_IN'>Transfer In</SelectItem>
                  <SelectItem value='TRANSFER_OUT'>Transfer Out</SelectItem>
                  <SelectItem value='FEE'>Fee</SelectItem>
                  <SelectItem value='BONUS'>Bonus</SelectItem>
                  <SelectItem value='REFUND'>Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium'>Status</label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='All statuses' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All statuses</SelectItem>
                  <SelectItem value='PLACED'>Placed</SelectItem>
                  <SelectItem value='CLOSED'>Closed</SelectItem>
                  <SelectItem value='FAILED'>Failed</SelectItem>
                  <SelectItem value='PROCESSING'>Processing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='mt-4 flex gap-2'>
            <Button onClick={applyFilters}>Apply Filters</Button>
            <Button variant='outline' onClick={clearFilters}>
              Clear Filters
            </Button>
            <Button
              variant='outline'
              onClick={handleRefresh}
              disabled={loading}
            >
              <IconRefresh className='mr-2 h-4 w-4' />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className='flex items-center justify-between'>
        <div className='text-muted-foreground text-sm'>
          Showing {transactions.length} of {pagination.total} transactions
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Transactions Table */}
      <UserTransactionsTableRoomStock
        transactions={transactions}
        loading={loading}
        onClose={handleCloseTransaction}
      />

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className='flex items-center justify-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            <IconChevronLeft className='h-4 w-4' />
            Previous
          </Button>

          <div className='flex items-center gap-1'>
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={pagination.page === page ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => handlePageChange(page)}
                  className='h-8 w-8 p-0'
                >
                  {page}
                </Button>
              );
            })}
          </div>

          <Button
            variant='outline'
            size='sm'
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
          >
            Next
            <IconChevronRight className='h-4 w-4' />
          </Button>
        </div>
      )}
    </div>
  );
}

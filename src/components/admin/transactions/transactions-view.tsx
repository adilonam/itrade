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
import { TransactionsTable } from './transactions-table';
import { TransactionForm } from './transaction-form';
import { TransactionStats } from './transaction-stats';
import type {
  TransactionWithRelations,
  TransactionFilters,
  TransactionStats as TransactionStatsType,
  TransactionType,
  TransactionStatus
} from '@/types/transaction';
import {
  IconPlus,
  IconSearch,
  IconFilter,
  IconChevronLeft,
  IconChevronRight,
  IconRefresh
} from '@tabler/icons-react';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export function TransactionsView() {
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>(
    []
  );
  const [stats, setStats] = useState<TransactionStatsType | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<TransactionWithRelations | null>(null);

  // Filters
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
    type: undefined,
    status: undefined,
    userId: undefined
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

      const response = await fetch(`/api/admin/transactions?${params}`);
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

  // Load stats
  const loadStats = async () => {
    try {
      const params = new URLSearchParams();
      if (currentFilters.userId) params.set('userId', currentFilters.userId);
      if (currentFilters.dateFrom)
        params.set('dateFrom', currentFilters.dateFrom.toISOString());
      if (currentFilters.dateTo)
        params.set('dateTo', currentFilters.dateTo.toISOString());

      const response = await fetch(`/api/admin/transactions/stats?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  // Load data on mount and when filters change
  useEffect(() => {
    loadTransactions(1, currentFilters);
  }, [currentFilters]);

  useEffect(() => {
    loadStats();
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

  // Handle transaction actions
  const handleTransactionCreated = () => {
    setShowForm(false);
    loadTransactions(pagination.page, currentFilters);
    loadStats();
  };

  const handleTransactionUpdated = () => {
    setEditingTransaction(null);
    loadTransactions(pagination.page, currentFilters);
    loadStats();
  };

  const handleTransactionDeleted = () => {
    loadTransactions(pagination.page, currentFilters);
    loadStats();
  };

  const handleEditTransaction = (transaction: TransactionWithRelations) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleRefresh = () => {
    loadTransactions(pagination.page, currentFilters);
    loadStats();
  };

  return (
    <div className='space-y-6'>
      {/* Stats Cards */}
      {stats && <TransactionStats stats={stats} />}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <IconFilter className='h-5 w-5' />
            Filters
          </CardTitle>
          <CardDescription>
            Filter transactions by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
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
                  <SelectItem value='PENDING'>Pending</SelectItem>
                  <SelectItem value='COMPLETED'>Completed</SelectItem>
                  <SelectItem value='FAILED'>Failed</SelectItem>
                  <SelectItem value='CANCELLED'>Cancelled</SelectItem>
                  <SelectItem value='PROCESSING'>Processing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium'>User ID</label>
              <Input
                placeholder='User ID...'
                value={filters.userId || ''}
                onChange={(e) =>
                  handleFilterChange('userId', e.target.value || undefined)
                }
              />
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
        <div className='flex items-center gap-2'>
          <Button onClick={() => setShowForm(true)}>
            <IconPlus className='mr-2 h-4 w-4' />
            Add Transaction
          </Button>
        </div>

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
      <TransactionsTable
        transactions={transactions}
        loading={loading}
        onEdit={handleEditTransaction}
        onDelete={handleTransactionDeleted}
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

      {/* Transaction Form Modal */}
      {showForm && (
        <TransactionForm
          transaction={editingTransaction}
          onClose={() => {
            setShowForm(false);
            setEditingTransaction(null);
          }}
          onSuccess={
            editingTransaction
              ? handleTransactionUpdated
              : handleTransactionCreated
          }
        />
      )}
    </div>
  );
}

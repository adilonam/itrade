'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserTransactionsTable } from './user-transactions/user-transactions-table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { IconRefresh, IconFilter } from '@tabler/icons-react';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

type Transaction = {
  id: string;
  type: 'GAIN' | 'LOSS' | 'DEPOSIT' | 'WITHDRAW';
  balanceType: 'REAL' | 'DEMO' | 'INSTITUTIONAL';
  absoluteAmount: number;
  description: string | null;
  createdAt: string;
};

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

function UserTransactionsListingContent() {
  const searchParams = useSearchParams();
  const transactionTypeParam = searchParams.get('type'); // Can be 'trade', 'stock', 'invest'

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all'); // GAIN, LOSS, DEPOSIT, WITHDRAW
  const [categoryFilter, setCategoryFilter] = useState<string>(
    transactionTypeParam || 'all' // trade, stock, invest
  );

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        balanceType: 'REAL'
      });

      if (typeFilter && typeFilter !== 'all') {
        params.append('type', typeFilter);
      }

      if (categoryFilter && categoryFilter !== 'all') {
        params.append('transactionType', categoryFilter);
      }

      const response = await fetch(
        `/api/user/transactions?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.transactions || []);
      setPagination((p) => ({
        ...p,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 0
      }));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to load transactions'
      );
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    typeFilter,
    categoryFilter
  ]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => loadTransactions()}
            disabled={loading}
          >
            <IconRefresh
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
        <div className='flex items-center gap-2'>
          <Select
            value={categoryFilter}
            onValueChange={(value) => {
              setCategoryFilter(value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <SelectTrigger className='w-[180px]'>
              <IconFilter className='mr-2 h-4 w-4' />
              <SelectValue placeholder='Category' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Categories</SelectItem>
              <SelectItem value='trade'>Trade</SelectItem>
              <SelectItem value='stock'>Stock</SelectItem>
              <SelectItem value='invest'>Invest</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={typeFilter}
            onValueChange={(value) => {
              setTypeFilter(value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Types</SelectItem>
              <SelectItem value='GAIN'>Gain</SelectItem>
              <SelectItem value='LOSS'>Loss</SelectItem>
              <SelectItem value='DEPOSIT'>Deposit</SelectItem>
              <SelectItem value='WITHDRAW'>Withdraw</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <UserTransactionsTable
        transactions={transactions}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

export default function UserTransactionsListing() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserTransactionsListingContent />
    </Suspense>
  );
}

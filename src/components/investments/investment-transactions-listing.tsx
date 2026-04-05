'use client';

import { useState, useEffect, useCallback } from 'react';
import { InvestmentTransaction } from './transactions-table/columns';
import { columns } from './transactions-table/columns';
import { TransactionsTable } from './transactions-table';
import { parseAsInteger, useQueryStates } from 'nuqs';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { IconFilter } from '@tabler/icons-react';

const TRANSACTION_TYPES = [
  'INVESTMENT_GAIN',
  'GAIN',
  'LOSS',
  'DEPOSIT',
  'WITHDRAW',
  'TRANSFER_IN',
  'TRANSFER_OUT'
] as const;

export default function InvestmentTransactionsListing() {
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('INVESTMENT_GAIN');

  const [queryParams, setQueryParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10)
  });

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('page', queryParams.page.toString());
      params.append('limit', queryParams.perPage.toString());
      params.append('balanceType', 'REAL');
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }

      const response = await fetch(
        `/api/user/transactions?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.transactions);
      setTotalTransactions(data.pagination.total);
    } catch (err) {
      setError('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, [queryParams.page, queryParams.perPage, typeFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  if (error) {
    return (
      <Card>
        <CardContent className='py-12 text-center'>
          <p className='text-red-600'>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Filter */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex items-center space-x-4'>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value);
                setQueryParams({ page: 1 });
              }}
            >
              <SelectTrigger className='w-[220px]'>
                <IconFilter className='mr-2 h-4 w-4' />
                <SelectValue placeholder='Transaction Type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All types</SelectItem>
                <SelectItem value='INVESTMENT_GAIN'>
                  Investment gain
                </SelectItem>
                {TRANSACTION_TYPES.filter((t) => t !== 'INVESTMENT_GAIN').map(
                  (t) => (
                    <SelectItem key={t} value={t}>
                      {t === 'GAIN'
                        ? 'Gain (trading)'
                        : t === 'LOSS'
                          ? 'Loss'
                          : t === 'DEPOSIT'
                            ? 'Deposit'
                            : t === 'WITHDRAW'
                              ? 'Withdraw'
                              : t === 'TRANSFER_IN'
                                ? 'Transfer in'
                                : 'Transfer out'}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <Card>
          <CardContent className='py-12 text-center'>
            <p className='text-muted-foreground'>Loading transactions...</p>
          </CardContent>
        </Card>
      ) : transactions.length === 0 ? (
        <Card>
          <CardContent className='py-12 text-center'>
            <p className='text-muted-foreground'>No transactions found</p>
          </CardContent>
        </Card>
      ) : (
        <TransactionsTable
          columns={columns}
          data={transactions}
          totalItems={totalTransactions}
        />
      )}
    </div>
  );
}

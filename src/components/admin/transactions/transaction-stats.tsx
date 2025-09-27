'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TransactionStats } from '@/types/transaction';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconCurrencyDollar,
  IconCheck,
  IconClock,
  IconX
} from '@tabler/icons-react';

interface TransactionStatsProps {
  stats: TransactionStats;
}

export function TransactionStats({ stats }: TransactionStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return 'text-green-600';
    if (pnl < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPnLIcon = (pnl: number) => {
    if (pnl > 0) return <IconTrendingUp className='h-4 w-4' />;
    if (pnl < 0) return <IconTrendingDown className='h-4 w-4' />;
    return null;
  };

  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
      {/* Total Transactions */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Total Transactions
          </CardTitle>
          <IconCurrencyDollar className='text-muted-foreground h-4 w-4' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {formatNumber(stats.totalTransactions)}
          </div>
          <p className='text-muted-foreground text-xs'>All time transactions</p>
        </CardContent>
      </Card>

      {/* Total Volume */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total Volume</CardTitle>
          <IconCurrencyDollar className='text-muted-foreground h-4 w-4' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {formatCurrency(stats.totalVolume)}
          </div>
          <p className='text-muted-foreground text-xs'>
            Total transaction volume
          </p>
        </CardContent>
      </Card>

      {/* Total P&L */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total P&L</CardTitle>
          {getPnLIcon(stats.totalPnL)}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getPnLColor(stats.totalPnL)}`}>
            {formatCurrency(stats.totalPnL)}
          </div>
          <p className='text-muted-foreground text-xs'>Profit & Loss</p>
        </CardContent>
      </Card>

      {/* Completed Transactions */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Completed</CardTitle>
          <IconCheck className='h-4 w-4 text-green-600' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-green-600'>
            {formatNumber(stats.completedTransactions)}
          </div>
          <p className='text-muted-foreground text-xs'>
            Successfully completed
          </p>
        </CardContent>
      </Card>

      {/* Pending Transactions */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Pending</CardTitle>
          <IconClock className='h-4 w-4 text-yellow-600' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-yellow-600'>
            {formatNumber(stats.pendingTransactions)}
          </div>
          <p className='text-muted-foreground text-xs'>Awaiting processing</p>
        </CardContent>
      </Card>

      {/* Failed Transactions */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Failed</CardTitle>
          <IconX className='h-4 w-4 text-red-600' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-red-600'>
            {formatNumber(stats.failedTransactions)}
          </div>
          <p className='text-muted-foreground text-xs'>Failed transactions</p>
        </CardContent>
      </Card>
    </div>
  );
}

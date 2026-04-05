'use client';

import { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import {
  IconArrowDownCircle,
  IconArrowUpCircle,
  IconTrendingUp,
  IconTrendingDown,
  IconArrowsRightLeft,
  IconPigMoney
} from '@tabler/icons-react';

export interface InvestmentTransaction {
  id: string;
  type:
    | 'GAIN'
    | 'INVESTMENT_GAIN'
    | 'LOSS'
    | 'DEPOSIT'
    | 'WITHDRAW'
    | 'TRANSFER_IN'
    | 'TRANSFER_OUT';
  absoluteAmount: number;
  description: string | null;
  createdAt: Date;
}

function transactionTypeLabel(type: InvestmentTransaction['type']) {
  switch (type) {
    case 'GAIN':
      return 'Gain';
    case 'INVESTMENT_GAIN':
      return 'Investment gain';
    case 'LOSS':
      return 'Loss';
    case 'DEPOSIT':
      return 'Deposit';
    case 'WITHDRAW':
      return 'Withdraw';
    case 'TRANSFER_IN':
      return 'Transfer in';
    case 'TRANSFER_OUT':
      return 'Transfer out';
    default:
      return type;
  }
}

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'GAIN':
      return <IconTrendingUp className='h-4 w-4 text-green-600' />;
    case 'INVESTMENT_GAIN':
      return <IconPigMoney className='h-4 w-4 text-emerald-600' />;
    case 'LOSS':
      return <IconTrendingDown className='h-4 w-4 text-red-600' />;
    case 'DEPOSIT':
      return <IconArrowDownCircle className='h-4 w-4 text-blue-600' />;
    case 'WITHDRAW':
      return <IconArrowUpCircle className='h-4 w-4 text-orange-600' />;
    case 'TRANSFER_IN':
      return <IconArrowsRightLeft className='h-4 w-4 text-teal-600' />;
    case 'TRANSFER_OUT':
      return <IconArrowsRightLeft className='h-4 w-4 text-amber-600' />;
    default:
      return null;
  }
};

const getTransactionColor = (type: string) => {
  switch (type) {
    case 'GAIN':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'INVESTMENT_GAIN':
      return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200';
    case 'LOSS':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'DEPOSIT':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'WITHDRAW':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    case 'TRANSFER_IN':
      return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300';
    case 'TRANSFER_OUT':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
    default:
      return '';
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const columns: ColumnDef<InvestmentTransaction>[] = [
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      return (
        <div className='flex items-center space-x-2'>
          {getTransactionIcon(type)}
          <Badge variant='outline' className={getTransactionColor(type)}>
            {transactionTypeLabel(type as InvestmentTransaction['type'])}
          </Badge>
        </div>
      );
    }
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => {
      const description = row.getValue('description') as string | null;
      return (
        <div className='max-w-[400px]'>
          <p className='text-sm'>{description || 'No description'}</p>
        </div>
      );
    }
  },
  {
    accessorKey: 'absoluteAmount',
    header: 'Amount',
    cell: ({ row }) => {
      const amount = row.getValue('absoluteAmount') as number;
      const type = row.original.type;
      const isPositive =
        type === 'GAIN' ||
        type === 'INVESTMENT_GAIN' ||
        type === 'DEPOSIT' ||
        type === 'TRANSFER_IN';

      return (
        <div
          className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}
        >
          {isPositive ? '+' : '-'}
          {formatCurrency(amount)}
        </div>
      );
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => {
      const createdAt = row.getValue('createdAt') as Date;
      return (
        <div className='text-muted-foreground text-sm'>
          {formatDate(createdAt)}
        </div>
      );
    }
  }
];

'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  IconLoader2,
  IconChevronLeft,
  IconChevronRight,
  IconTrendingUp,
  IconTrendingDown,
  IconArrowDown,
  IconArrowUp,
  IconArrowsRightLeft,
  IconPigMoney
} from '@tabler/icons-react';

type Transaction = {
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
  createdAt: string;
};

interface UserTransactionsTableProps {
  transactions: Transaction[];
  loading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onPageChange: (page: number) => void;
}

export function UserTransactionsTable({
  transactions,
  loading,
  pagination,
  onPageChange
}: UserTransactionsTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number, type: string) => {
    const sign =
      type === 'GAIN' ||
      type === 'INVESTMENT_GAIN' ||
      type === 'DEPOSIT' ||
      type === 'TRANSFER_IN'
        ? '+'
        : '-';
    return `${sign}${Math.abs(amount).toFixed(2)}`;
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'GAIN':
        return (
          <Badge variant='default' className='bg-green-500 text-white'>
            <IconTrendingUp className='mr-1 h-3 w-3' />
            Gain
          </Badge>
        );
      case 'INVESTMENT_GAIN':
        return (
          <Badge variant='default' className='bg-emerald-600 text-white'>
            <IconPigMoney className='mr-1 h-3 w-3' />
            Investment gain
          </Badge>
        );
      case 'LOSS':
        return (
          <Badge variant='destructive'>
            <IconTrendingDown className='mr-1 h-3 w-3' />
            Loss
          </Badge>
        );
      case 'DEPOSIT':
        return (
          <Badge variant='default' className='bg-blue-500 text-white'>
            <IconArrowDown className='mr-1 h-3 w-3' />
            Deposit
          </Badge>
        );
      case 'WITHDRAW':
        return (
          <Badge variant='secondary'>
            <IconArrowUp className='mr-1 h-3 w-3' />
            Withdraw
          </Badge>
        );
      case 'TRANSFER_IN':
        return (
          <Badge variant='default' className='bg-teal-600 text-white'>
            <IconArrowsRightLeft className='mr-1 h-3 w-3' />
            Transfer in
          </Badge>
        );
      case 'TRANSFER_OUT':
        return (
          <Badge variant='secondary' className='bg-amber-600/90 text-white'>
            <IconArrowsRightLeft className='mr-1 h-3 w-3' />
            Transfer out
          </Badge>
        );
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'GAIN':
      case 'INVESTMENT_GAIN':
      case 'DEPOSIT':
      case 'TRANSFER_IN':
        return 'text-green-600 font-semibold';
      case 'LOSS':
      case 'WITHDRAW':
      case 'TRANSFER_OUT':
        return 'text-red-600 font-semibold';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-8'>
          <IconLoader2 className='h-6 w-6 animate-spin' />
          <span className='ml-2'>Loading transactions...</span>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Your transactions will appear here</CardDescription>
        </CardHeader>
        <CardContent className='flex items-center justify-center py-8'>
          <div className='text-center'>
            <p className='text-muted-foreground'>No transactions found</p>
            <p className='text-muted-foreground mt-1 text-sm'>
              Transactions will appear here as you make trades, investments, or
              deposits
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions ({pagination.total})</CardTitle>
        <CardDescription>View all your transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='relative flex min-h-[600px] flex-col'>
          <div className='flex flex-1 flex-col space-y-4'>
            <div className='relative flex flex-1'>
              <div className='absolute inset-0 flex overflow-hidden rounded-lg border'>
                <ScrollArea className='h-full w-full' horizontal>
                  <Table>
                    <TableHeader className='bg-muted sticky top-0 z-10'>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className='text-right'>Amount</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {getTypeBadge(transaction.type)}
                          </TableCell>
                          <TableCell className='max-w-md'>
                            <div className='text-sm'>
                              {transaction.description || 'No description'}
                            </div>
                          </TableCell>
                          <TableCell
                            className={`text-right ${getAmountColor(transaction.type)}`}
                          >
                            {formatAmount(
                              transaction.absoluteAmount,
                              transaction.type
                            )}
                          </TableCell>
                          <TableCell className='text-muted-foreground text-xs'>
                            {formatDate(transaction.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          </div>
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className='mt-4 flex items-center justify-between'>
              <div className='text-muted-foreground text-sm'>
                Page {pagination.page} of {pagination.pages}
              </div>
              <div className='flex gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
                  disabled={pagination.page === 1}
                >
                  <IconChevronLeft className='h-4 w-4' />
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() =>
                    onPageChange(
                      Math.min(pagination.pages, pagination.page + 1)
                    )
                  }
                  disabled={pagination.page >= pagination.pages}
                >
                  <IconChevronRight className='h-4 w-4' />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

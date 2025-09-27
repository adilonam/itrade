'use client';

import { useState } from 'react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import type {
  TransactionWithRelations,
  TransactionType,
  TransactionStatus
} from '@/types/transaction';
import {
  IconEdit,
  IconTrash,
  IconEye,
  IconTrendingUp,
  IconTrendingDown
} from '@tabler/icons-react';

interface TransactionsTableProps {
  transactions: TransactionWithRelations[];
  loading: boolean;
  onEdit: (transaction: TransactionWithRelations) => void;
  onDelete: () => void;
}

export function TransactionsTable({
  transactions,
  loading,
  onEdit,
  onDelete
}: TransactionsTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case 'BUY':
        return 'bg-green-100 text-green-800';
      case 'SELL':
        return 'bg-red-100 text-red-800';
      case 'DEPOSIT':
        return 'bg-blue-100 text-blue-800';
      case 'WITHDRAWAL':
        return 'bg-orange-100 text-orange-800';
      case 'TRANSFER_IN':
        return 'bg-purple-100 text-purple-800';
      case 'TRANSFER_OUT':
        return 'bg-pink-100 text-pink-800';
      case 'FEE':
        return 'bg-gray-100 text-gray-800';
      case 'BONUS':
        return 'bg-yellow-100 text-yellow-800';
      case 'REFUND':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      const response = await fetch(`/api/admin/transactions/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete transaction');
      }

      onDelete();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Loading transactions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-8'>
            <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>No transactions found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='text-muted-foreground py-8 text-center'>
            No transactions match your current filters.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
        <CardDescription>
          Manage and monitor all user transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Market</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>P&L</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className='font-mono text-xs'>
                    {transaction.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className='font-medium'>
                        {transaction.user.name || 'N/A'}
                      </div>
                      <div className='text-muted-foreground text-sm'>
                        {transaction.user.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(transaction.type)}>
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {transaction.market ? (
                      <div>
                        <div className='font-medium'>
                          {transaction.market.symbol}
                        </div>
                        <div className='text-muted-foreground text-sm'>
                          {transaction.market.name}
                        </div>
                      </div>
                    ) : (
                      <span className='text-muted-foreground'>N/A</span>
                    )}
                  </TableCell>
                  <TableCell className='font-mono'>
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell className='font-mono'>
                    {transaction.quantity
                      ? transaction.quantity.toFixed(4)
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {transaction.pnl !== null ? (
                      <div
                        className={`flex items-center gap-1 font-mono ${
                          transaction.pnl > 0
                            ? 'text-green-600'
                            : transaction.pnl < 0
                              ? 'text-red-600'
                              : 'text-gray-600'
                        }`}
                      >
                        {transaction.pnl > 0 ? (
                          <IconTrendingUp className='h-3 w-3' />
                        ) : transaction.pnl < 0 ? (
                          <IconTrendingDown className='h-3 w-3' />
                        ) : null}
                        {formatCurrency(transaction.pnl)}
                      </div>
                    ) : (
                      <span className='text-muted-foreground'>N/A</span>
                    )}
                  </TableCell>
                  <TableCell className='text-sm'>
                    {formatDate(transaction.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => onEdit(transaction)}
                      >
                        <IconEdit className='h-3 w-3' />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant='outline'
                            size='sm'
                            disabled={deletingId === transaction.id}
                          >
                            <IconTrash className='h-3 w-3' />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete Transaction
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this transaction?
                              This action cannot be undone.
                              <br />
                              <br />
                              <strong>Transaction ID:</strong> {transaction.id}
                              <br />
                              <strong>Type:</strong> {transaction.type}
                              <br />
                              <strong>Amount:</strong>{' '}
                              {formatCurrency(transaction.amount)}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(transaction.id)}
                              className='bg-red-600 hover:bg-red-700'
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

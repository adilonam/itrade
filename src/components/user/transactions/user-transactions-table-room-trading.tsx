'use client';

import { useState, useEffect } from 'react';
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
import type { Market, Transaction } from '@prisma/client';
import { useMarketsWebSocket } from '@/contexts/markets-websocket-context';
import { calculatePnLClient } from '@/lib/pnl-calculator-client';
import {
  IconX,
  IconLoader2,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus
} from '@tabler/icons-react';

type TransactionWithMarket = Transaction & {
  market: Market | null;
};
interface UserTransactionsTableRoomTradingProps {
  transactions: TransactionWithMarket[];
  loading: boolean;
  onClose: (transactionId: string) => void;
}
export function UserTransactionsTableRoomTrading({
  transactions,
  loading,
  onClose
}: UserTransactionsTableRoomTradingProps) {
  const [closingTransactionId, setClosingTransactionId] = useState<
    string | null
  >(null);

  const { realTimePrices, isConnected, reset, subscribe } =
    useMarketsWebSocket();

  // Reset websocket subscriptions and subscribe to all markets in transactions
  useEffect(() => {
    if (isConnected && transactions.length > 0) {
      // Reset first to clear any existing subscriptions
      reset();

      // Get unique market symbols from transactions
      const marketSymbols = transactions
        .map((t) => t.market?.symbol)
        .filter((symbol): symbol is string => Boolean(symbol))
        .filter((symbol, index, array) => array.indexOf(symbol) === index); // Remove duplicates

      if (marketSymbols.length > 0) {
        subscribe(marketSymbols);
      }
    }
  }, [isConnected, transactions, reset, subscribe]);

  const handleCloseTransaction = async (transactionId: string) => {
    setClosingTransactionId(transactionId);
    try {
      await onClose(transactionId);
    } finally {
      setClosingTransactionId(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'CLOSED':
        return 'default';
      case 'PLACED':
        return 'secondary';
      case 'PROCESSING':
        return 'outline';
      case 'FAILED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'BUY':
        return <IconTrendingUp className='h-4 w-4 text-green-600' />;
      case 'SELL':
        return <IconTrendingDown className='h-4 w-4 text-red-600' />;
      default:
        return <IconMinus className='h-4 w-4 text-gray-600' />;
    }
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

  const canCloseTransaction = (status: string) => {
    return ['PLACED', 'PROCESSING'].includes(status);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-8'>
          <IconLoader2 className='h-6 w-6 animate-spin' />
          <span className='ml-2'>Loading room trading transactions...</span>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-8'>
          <div className='text-center'>
            <p className='text-muted-foreground'>
              No room trading transactions found
            </p>
            <p className='text-muted-foreground mt-1 text-sm'>
              Your room trading transactions will appear here once you start
              trading
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Room Trading Transactions</CardTitle>
        <CardDescription>
          View and manage your room trading transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Market</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Exec Price</TableHead>
                <TableHead>Closed Price</TableHead>
                <TableHead>Take Profit</TableHead>
                <TableHead>Stop Loss</TableHead>
                <TableHead>P&L</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Closed</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      {getTypeIcon(transaction.type)}
                      <span className='font-medium'>{transaction.type}</span>
                    </div>
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
                      <span className='text-muted-foreground'>-</span>
                    )}
                  </TableCell>
                  <TableCell className='text-xs'>
                    {transaction.quantity
                      ? transaction.quantity.toFixed(4)
                      : '-'}
                  </TableCell>
                  <TableCell className='text-xs'>
                    {transaction.executedPrice
                      ? `$${transaction.executedPrice.toFixed(2)}`
                      : '-'}
                  </TableCell>
                  <TableCell className='text-xs'>
                    {transaction.closedPrice
                      ? `$${transaction.closedPrice.toFixed(2)}`
                      : '-'}
                  </TableCell>
                  <TableCell className='text-xs'>
                    {transaction.takeProfit
                      ? `$${transaction.takeProfit.toFixed(2)}`
                      : '-'}
                  </TableCell>
                  <TableCell className='text-xs'>
                    {transaction.stopLoss
                      ? `$${transaction.stopLoss.toFixed(2)}`
                      : '-'}
                  </TableCell>
                  <TableCell className='text-xs'>
                    {(() => {
                      const realTimeData = transaction.market?.symbol
                        ? realTimePrices.get(transaction.market.symbol)
                        : undefined;
                      const dynamicPnL = calculatePnLClient(
                        transaction,
                        realTimeData
                      );

                      if (dynamicPnL !== null) {
                        return (
                          <span
                            className={
                              dynamicPnL >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }
                          >
                            {dynamicPnL >= 0 ? '+' : ''}${dynamicPnL.toFixed(2)}
                            {transaction.status === 'PLACED' &&
                              realTimeData && (
                                <span className='text-muted-foreground ml-1 text-xs'>
                                  (live)
                                </span>
                              )}
                          </span>
                        );
                      }

                      return <span className='text-muted-foreground'>-</span>;
                    })()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusBadgeVariant(transaction.status)}
                      className='text-xs'
                    >
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-muted-foreground text-xs'>
                    {formatDate(transaction.executedAt || new Date())}
                  </TableCell>
                  <TableCell className='text-muted-foreground text-xs'>
                    {transaction.closedAt
                      ? formatDate(transaction.closedAt)
                      : '-'}
                  </TableCell>
                  <TableCell className='text-right'>
                    {canCloseTransaction(transaction.status) ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant='outline'
                            size='sm'
                            disabled={closingTransactionId === transaction.id}
                          >
                            {closingTransactionId === transaction.id ? (
                              <IconLoader2 className='h-4 w-4 animate-spin' />
                            ) : (
                              <IconX className='h-4 w-4' />
                            )}
                            Close
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Close Room Trading Transaction
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to close this{' '}
                              {transaction.type} room trading transaction? This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleCloseTransaction(transaction.id)
                              }
                              className='bg-red-600 hover:bg-red-700'
                            >
                              Close Transaction
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <span className='text-muted-foreground text-sm'>
                        {transaction.status === 'CLOSED' ? 'Closed' : 'Closed'}
                      </span>
                    )}
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

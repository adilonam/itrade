'use client';

import { useState } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { calculatePnLClient } from '@/lib/calculator-client';
import {
  IconX,
  IconLoader2,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconChevronLeft,
  IconChevronRight
} from '@tabler/icons-react';

type PositionWithUser = {
  id: string;
  type: string;
  status: string;
  room: string;
  quantity: number;
  executedPrice: number | null;
  closedPrice: number | null;
  takeProfit: number | null;
  stopLoss: number | null;
  executedAt: Date | string | null;
  closedAt: Date | string | null;
  pnl: number | null;
  calculatedPnL?: number | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  market: {
    id: string;
    symbol: string;
    name: string;
    lastPrice: number;
  } | null;
};

interface SellerPositionsTableProps {
  positions: PositionWithUser[];
  loading: boolean;
  room: 'TRADING' | 'STOCK';
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onClose: (positionId: string) => void;
  onPageChange: (page: number) => void;
}

export function SellerPositionsTable({
  positions,
  loading,
  room,
  pagination,
  onClose,
  onPageChange
}: SellerPositionsTableProps) {
  const [closingPositionId, setClosingPositionId] = useState<string | null>(
    null
  );

  const handleClosePosition = async (positionId: string) => {
    setClosingPositionId(positionId);
    try {
      await onClose(positionId);
    } finally {
      setClosingPositionId(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'CLOSED':
        return 'default';
      case 'PLACED':
        return 'secondary';
      case 'PENDING':
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

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canClosePosition = (status: string) => {
    return ['PLACED', 'PENDING'].includes(status);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-8'>
          <IconLoader2 className='h-6 w-6 animate-spin' />
          <span className='ml-2'>Loading positions...</span>
        </CardContent>
      </Card>
    );
  }

  if (positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {room === 'TRADING' ? 'Trading Room' : 'Stock Room'} Positions
          </CardTitle>
          <CardDescription>
            Positions of your linked users will appear here
          </CardDescription>
        </CardHeader>
        <CardContent className='flex items-center justify-center py-8'>
          <div className='text-center'>
            <p className='text-muted-foreground'>No positions found</p>
            <p className='text-muted-foreground mt-1 text-sm'>
              Positions for {room === 'TRADING' ? 'trading room' : 'stock room'}{' '}
              will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {room === 'TRADING' ? 'Trading Room' : 'Stock Room'} Positions (
          {pagination.total})
        </CardTitle>
        <CardDescription>
          View and manage positions of your linked users
        </CardDescription>
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
                        <TableHead>User</TableHead>
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
                      {positions.map((position) => {
                        // Calculate PnL for PLACED positions using market's lastPrice
                        let displayPnL = position.pnl || 0;

                        if (position.status === 'PLACED' && position.market) {
                          // Use calculatedPnL from API if available, otherwise calculate with market's lastPrice
                          if (
                            position.calculatedPnL !== null &&
                            position.calculatedPnL !== undefined
                          ) {
                            displayPnL = position.calculatedPnL;
                          } else {
                            // Calculate using market's lastPrice as current price
                            const currentPriceData = {
                              event: 'price' as const,
                              symbol: position.market.symbol,
                              price: position.market.lastPrice,
                              timestamp: Date.now()
                            };
                            const calculatedPnL = calculatePnLClient(
                              position as any,
                              currentPriceData
                            );
                            if (calculatedPnL !== null) {
                              displayPnL = calculatedPnL;
                            }
                          }
                        }

                        return (
                          <TableRow key={position.id}>
                            <TableCell>
                              <div>
                                <div className='font-medium'>
                                  {position.user.name || 'No Name'}
                                </div>
                                <div className='text-muted-foreground text-xs'>
                                  {position.user.email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className='flex items-center gap-2'>
                                {getTypeIcon(position.type)}
                                <span className='font-medium'>
                                  {position.type}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {position.market ? (
                                <div>
                                  <div className='font-medium'>
                                    {position.market.symbol}
                                  </div>
                                  <div className='text-muted-foreground text-sm'>
                                    {position.market.name}
                                  </div>
                                </div>
                              ) : (
                                <span className='text-muted-foreground'>-</span>
                              )}
                            </TableCell>
                            <TableCell className='text-xs'>
                              {position.quantity
                                ? parseFloat(position.quantity.toString())
                                : '-'}
                            </TableCell>
                            <TableCell className='text-xs'>
                              {position.executedPrice
                                ? `$${position.executedPrice.toFixed(2)}`
                                : '-'}
                            </TableCell>
                            <TableCell className='text-xs'>
                              {position.closedPrice
                                ? `$${position.closedPrice.toFixed(2)}`
                                : '-'}
                            </TableCell>
                            <TableCell className='text-xs'>
                              {position.takeProfit
                                ? `$${position.takeProfit.toFixed(2)}`
                                : '-'}
                            </TableCell>
                            <TableCell className='text-xs'>
                              {position.stopLoss
                                ? `$${position.stopLoss.toFixed(2)}`
                                : '-'}
                            </TableCell>
                            <TableCell className='text-xs'>
                              <span
                                className={
                                  displayPnL >= 0
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }
                              >
                                {displayPnL >= 0 ? '+' : ''}$
                                {displayPnL.toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getStatusBadgeVariant(position.status)}
                                className='text-xs'
                              >
                                {position.status}
                              </Badge>
                            </TableCell>
                            <TableCell className='text-muted-foreground text-xs'>
                              {formatDate(position.executedAt)}
                            </TableCell>
                            <TableCell className='text-muted-foreground text-xs'>
                              {position.closedAt
                                ? formatDate(position.closedAt)
                                : '-'}
                            </TableCell>
                            <TableCell className='text-right'>
                              {canClosePosition(position.status) ? (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant='outline'
                                      size='sm'
                                      disabled={
                                        closingPositionId === position.id
                                      }
                                    >
                                      {closingPositionId === position.id ? (
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
                                        Close Position
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to close this{' '}
                                        {position.type} position for{' '}
                                        {position.user.name ||
                                          position.user.email}
                                        ? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleClosePosition(position.id)
                                        }
                                        className='bg-red-600 hover:bg-red-700'
                                      >
                                        Close Position
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              ) : (
                                <span className='text-muted-foreground text-sm'>
                                  Closed
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
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

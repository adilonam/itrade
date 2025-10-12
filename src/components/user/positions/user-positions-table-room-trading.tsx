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
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { DataTablePagination } from '@/components/ui/table/data-table-pagination';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { flexRender, type Table as TanstackTable } from '@tanstack/react-table';
import type { Market, Position } from '@prisma/client';
import { useMarketsWebSocket } from '@/contexts/markets-websocket-context';
import { calculatePnLClient } from '@/lib/calculator-client';
import {
  IconX,
  IconLoader2,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus
} from '@tabler/icons-react';

type PositionWithMarket = Position & {
  market: Market | null;
};
interface UserPositionsTableRoomTradingProps {
  positions: PositionWithMarket[];
  loading: boolean;
  onClose: (positionId: string) => void;
  onUpdateRealTimePnL?: (positionId: string, pnl: number) => void;
  realTimePnL?: Record<string, number>;
}
export function UserPositionsTableRoomTrading({
  positions,
  loading,
  onClose,
  onUpdateRealTimePnL,
  realTimePnL = {}
}: UserPositionsTableRoomTradingProps) {
  const [closingPositionId, setClosingPositionId] = useState<string | null>(
    null
  );

  const { realTimePrices, isConnected, reset, subscribe } =
    useMarketsWebSocket();

  // Reset websocket subscriptions and subscribe to all markets in positions
  useEffect(() => {
    if (isConnected && positions.length > 0) {
      // Reset first to clear any existing subscriptions
      reset();

      // Get unique market symbols from positions
      const marketSymbols = positions
        .map((t) => t.market?.symbol)
        .filter((symbol): symbol is string => Boolean(symbol))
        .filter((symbol, index, array) => array.indexOf(symbol) === index); // Remove duplicates

      if (marketSymbols.length > 0) {
        subscribe(marketSymbols);
      }
    }
  }, [isConnected, positions, reset, subscribe]);

  // Update real-time PnL when market data changes
  useEffect(() => {
    if (onUpdateRealTimePnL) {
      positions.forEach((position) => {
        if (position.market?.symbol) {
          const realTimeData = realTimePrices.get(position.market.symbol);
          if (realTimeData) {
            const dynamicPnL = position.market
              ? calculatePnLClient(position as any, realTimeData)
              : null;
            if (dynamicPnL !== null) {
              onUpdateRealTimePnL(position.id, dynamicPnL);
            }
          }
        }
      });
    }
  }, [positions, realTimePrices, onUpdateRealTimePnL]);

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

  const formatDate = (date: Date | string) => {
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
          <span className='ml-2'>Loading room trading positions...</span>
        </CardContent>
      </Card>
    );
  }

  if (positions.length === 0) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-8'>
          <div className='text-center'>
            <p className='text-muted-foreground'>
              No room trading positions found
            </p>
            <p className='text-muted-foreground mt-1 text-sm'>
              Your room trading positions will appear here once you start
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
        <CardTitle>Your Room Trading Positions</CardTitle>
        <CardDescription>
          View and manage your room trading positions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='relative flex min-h-[600px] flex-col'>
          <div className='flex flex-1 flex-col space-y-4'>
            <div className='relative flex flex-1'>
              <div className='absolute inset-0 flex overflow-hidden rounded-lg border'>
                <ScrollArea className='h-full w-full'>
                  <Table>
                    <TableHeader className='bg-muted sticky top-0 z-10'>
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
                      {positions.map((position) => (
                        <TableRow key={position.id}>
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
                            {(() => {
                              // For non-placed positions, always show position.pnl
                              if (position.status !== 'PLACED') {
                                const pnl = position.pnl || 0;
                                return (
                                  <span
                                    className={
                                      pnl >= 0
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                    }
                                  >
                                    {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                                  </span>
                                );
                              }

                              // For placed positions, try to get dynamic PnL, fallback to position.pnl
                              const realTimeData = position.market?.symbol
                                ? realTimePrices.get(position.market.symbol)
                                : undefined;
                              const dynamicPnL = position.market
                                ? calculatePnLClient(
                                    position as any,
                                    realTimeData
                                  )
                                : null;

                              // Use dynamic PnL if available, otherwise fallback to position.pnl
                              const displayPnL =
                                dynamicPnL !== null
                                  ? dynamicPnL
                                  : position.pnl || 0;
                              const isLive =
                                dynamicPnL !== null && realTimeData;

                              return (
                                <span
                                  className={
                                    displayPnL >= 0
                                      ? 'text-green-600'
                                      : 'text-red-600'
                                  }
                                >
                                  {displayPnL >= 0 ? '+' : ''}$
                                  {displayPnL.toFixed(2)}
                                  {isLive && (
                                    <span className='text-muted-foreground ml-1 text-xs'>
                                      (live)
                                    </span>
                                  )}
                                </span>
                              );
                            })()}
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
                            {formatDate(position.executedAt || new Date())}
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
                                    disabled={closingPositionId === position.id}
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
                                      Close Room Trading Position
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to close this{' '}
                                      {position.type} room trading position?
                                      This action cannot be undone.
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
                                {position.status === 'CLOSED'
                                  ? 'Closed'
                                  : 'Closed'}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation='horizontal' />
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

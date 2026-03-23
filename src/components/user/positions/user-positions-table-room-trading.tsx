'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { Market, Position } from '@/lib/prisma/generated/client';
import { useMarketsWebSocket } from '@/contexts/markets-websocket-context';
import { calculatePnLClient } from '@/lib/calculator-client';
import {
  IconX,
  IconLoader2,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus
} from '@tabler/icons-react';
import { toast } from 'sonner';
import type { Room } from '@/lib/prisma/generated/client';
import { cn } from '@/lib/utils';

type PositionWithMarket = Position & {
  market: Market | null;
};

const tradeRoomPositionsCardClass =
  'border border-[var(--trade-border)] bg-[var(--trade-panel)] text-[var(--trade-text)] shadow-none py-4 gap-4';

interface UserPositionsTableRoomTradingProps {
  positions: PositionWithMarket[];
  loading: boolean;
  onClose: (positionId: string) => void;
  onUpdateRealTimePnL?: (positionId: string, pnl: number) => void;
  realTimePnL?: Record<string, number>;
  /** Match `/trade` trade-room panel typography and colors */
  panelVariant?: 'default' | 'trade';
}
export function UserPositionsTableRoomTrading({
  positions,
  loading,
  onClose,
  onUpdateRealTimePnL,
  panelVariant = 'default'
}: UserPositionsTableRoomTradingProps) {
  const isTradePanel = panelVariant === 'trade';
  const [closingPositionId, setClosingPositionId] = useState<string | null>(
    null
  );

  const { realTimePrices, isConnected, reset, subscribe } =
    useMarketsWebSocket();

  // Reset websocket subscriptions and subscribe to all markets in positions
  useEffect(() => {
    if (isConnected && positions.length > 0) {
      // Reset first to clear any existing subscriptions
      // reset();

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
      <Card
        className={cn(isTradePanel && tradeRoomPositionsCardClass)}
      >
        <CardContent
          className={cn(
            'flex flex-col items-center justify-center py-12',
            isTradePanel && 'text-xs text-[var(--trade-text-muted)]'
          )}
        >
          <IconLoader2
            className={cn(
              'mb-4 h-6 w-6 animate-spin',
              isTradePanel ? 'text-[var(--trade-text-muted)]' : 'text-muted-foreground'
            )}
          />
          <p className='text-center'>
            Loading room trading positions...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (positions.length === 0) {
    return (
      <Card
        className={cn(isTradePanel && tradeRoomPositionsCardClass)}
      >
        <CardContent
          className={cn(
            'flex flex-col items-center justify-center py-12',
            isTradePanel && 'text-xs text-[var(--trade-text-muted)]'
          )}
        >
          <p className='text-center'>
            No room trading positions found. Positions will appear here once you start trading.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'flex max-h-[min(70vh,520px)] flex-col overflow-hidden',
        isTradePanel && tradeRoomPositionsCardClass
      )}
    >
      <CardHeader
        className={cn('shrink-0', isTradePanel && 'px-4 pb-0 pt-0')}
      >
        <CardTitle
          className={cn(isTradePanel && 'text-sm font-semibold')}
        >
          Your Room Trading Positions
        </CardTitle>
        <CardDescription
          className={cn(
            isTradePanel && 'text-xs text-[var(--trade-text-muted)]'
          )}
        >
          View and manage your room trading positions
        </CardDescription>
      </CardHeader>
      <CardContent
        className={cn(
          'min-h-[240px] min-w-0 flex-1 overflow-hidden',
          isTradePanel && 'px-4'
        )}
      >
        <div className='relative flex h-full min-h-[200px] flex-col'>
          <div className='relative flex min-h-0 flex-1'>
            <div
              className={cn(
                'absolute inset-0 flex overflow-auto rounded-lg border',
                isTradePanel && 'border-[var(--trade-border)]'
              )}
            >
              <ScrollArea className='h-full w-full'>
                <Table className={cn(isTradePanel && 'text-xs')}>
                  <TableHeader
                    className={cn(
                      'sticky top-0 z-10',
                      isTradePanel
                        ? 'bg-[var(--trade-dark)]/50 [&_th]:h-9 [&_th]:px-2 [&_th]:text-xs'
                        : 'bg-muted'
                    )}
                  >
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Market</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Exec Price</TableHead>
                      <TableHead>Closed Price</TableHead>
                      <TableHead>Take Profit</TableHead>
                      <TableHead>Stop Loss</TableHead>
                      <TableHead>Value</TableHead>
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
                            <span className='font-medium'>{position.type}</span>
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
                          {position.requiredMargin
                            ? `$${position.requiredMargin.toFixed(2)}`
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
                                    pnl >= 0 ? 'text-green-600' : 'text-red-600'
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
                            const isLive = dynamicPnL !== null && realTimeData;

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
                                    {position.type} room trading position? This
                                    action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
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
                <ScrollBar orientation='vertical' />
              </ScrollArea>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Tab filter maps to PositionStatus: open=PLACED, pending=PENDING, closed=CLOSED+FAILED */
export type PositionTabFilter = 'open' | 'pending' | 'closed';

/**
 * Standalone card component that fetches room trading positions and renders
 * the table. Use this when you only need the "Your Room Trading Positions"
 * card (e.g. at the bottom of the trading view page).
 * @param statusFilter - Filter by position status tab: open (PLACED), pending (PENDING), closed (CLOSED, FAILED)
 */
interface UserPositionsTableCardRoomTradingProps {
  statusFilter?: PositionTabFilter;
  room?: Room;
  refreshEventName?: string;
  panelVariant?: 'default' | 'trade';
}

export function UserPositionsTableCardRoomTrading({
  statusFilter = 'open',
  room = 'TRADING',
  refreshEventName = 'room-trading-positions-refresh',
  panelVariant = 'default'
}: UserPositionsTableCardRoomTradingProps) {
  const balanceType = room === 'INSTITUTIONAL' ? 'INSTITUTIONAL' : 'REAL';
  const [positions, setPositions] = useState<PositionWithMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realTimePnL, setRealTimePnL] = useState<Record<string, number>>({});

  const loadPositions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: '1',
        limit: '10',
        room,
        balanceType
      });
      if (statusFilter === 'open') params.set('status', 'PLACED');
      else if (statusFilter === 'pending') params.set('status', 'PENDING');
      else if (statusFilter === 'closed') params.set('status', 'CLOSED,FAILED');
      const response = await fetch(`/api/user/positions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch positions');
      const data = await response.json();
      setPositions(data.positions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load positions');
    } finally {
      setLoading(false);
    }
  }, [room, balanceType, statusFilter]);

  useEffect(() => {
    loadPositions();
  }, [loadPositions]);

  // Refresh positions when buy/sell is completed (e.g. from trading actions on this page)
  useEffect(() => {
    const handler = () => loadPositions();
    window.addEventListener(refreshEventName, handler);
    return () =>
      window.removeEventListener(refreshEventName, handler);
  }, [loadPositions, refreshEventName]);

  const handleClosePosition = useCallback(
    async (positionId: string) => {
      try {
        const response = await fetch(
          `/api/user/positions/${positionId}/close`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'CLOSED', balanceType })
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to close position');
        }
        toast.success('Position closed successfully');
        loadPositions();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to close position'
        );
      }
    },
    [loadPositions, balanceType]
  );

  const updateRealTimePnL = useCallback((positionId: string, pnl: number) => {
    setRealTimePnL((prev) => ({ ...prev, [positionId]: pnl }));
  }, []);

  if (error) {
    return (
      <Card
        className={cn(
          panelVariant === 'trade' && tradeRoomPositionsCardClass
        )}
      >
        <CardContent
          className={cn(
            'flex items-center justify-center py-8',
            panelVariant === 'trade' && 'px-4 text-xs'
          )}
        >
          <p
            className={cn(
              'text-sm',
              panelVariant === 'trade'
                ? 'text-[var(--trade-red)]'
                : 'text-destructive'
            )}
          >
            {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <UserPositionsTableRoomTrading
      positions={positions}
      loading={loading}
      onClose={handleClosePosition}
      onUpdateRealTimePnL={updateRealTimePnL}
      realTimePnL={realTimePnL}
      panelVariant={panelVariant}
    />
  );
}

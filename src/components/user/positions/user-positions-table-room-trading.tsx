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
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
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
import type { Market, Position } from '@/lib/prisma/generated/client';
import { useMarketsWebSocket } from '@/contexts/markets-websocket-context';
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
import { toast } from 'sonner';
import type { Room } from '@/lib/prisma/generated/client';
import { cn } from '@/lib/utils';
import {
  TRADE_ROOM_CARD_CLASS,
  TRADE_ROOM_EMBEDDED_TABLE_CARD_CLASS
} from '@/constants/trade-room-ui';

type PositionWithMarket = Position & {
  market: Market | null;
};

const POSITION_PAGE_SIZE_OPTIONS = [5, 10, 25, 50] as const;

export type PositionsTablePagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

interface UserPositionsTableRoomTradingProps {
  positions: PositionWithMarket[];
  loading: boolean;
  onClose: (positionId: string) => void;
  onUpdateRealTimePnL?: (positionId: string, pnl: number) => void;
  realTimePnL?: Record<string, number>;
  /** Match `/trade` trade-room panel typography and colors */
  panelVariant?: 'default' | 'trade';
  /** When true with `trade`, omit nested card chrome (trade room bottom tabs panel). */
  embeddedInTradePanel?: boolean;
  pagination?: PositionsTablePagination;
}
export function UserPositionsTableRoomTrading({
  positions,
  loading,
  onClose,
  onUpdateRealTimePnL,
  panelVariant = 'default',
  embeddedInTradePanel = false,
  pagination
}: UserPositionsTableRoomTradingProps) {
  const isTradePanel = panelVariant === 'trade';
  const isEmbeddedTrade = isTradePanel && embeddedInTradePanel;
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
    const buy =
      'h-4 w-4 ' +
      (isTradePanel ? 'text-[var(--trade-green)]' : 'text-green-600');
    const sell =
      'h-4 w-4 ' +
      (isTradePanel ? 'text-[var(--trade-red)]' : 'text-red-600');
    const neutral =
      'h-4 w-4 ' +
      (isTradePanel ? 'text-[var(--trade-text-muted)]' : 'text-gray-600');
    switch (type) {
      case 'BUY':
        return <IconTrendingUp className={buy} />;
      case 'SELL':
        return <IconTrendingDown className={sell} />;
      default:
        return <IconMinus className={neutral} />;
    }
  };

  const mutedCell = isTradePanel
    ? 'text-[var(--trade-text-muted)]'
    : 'text-muted-foreground';

  const pnlPositive = isTradePanel ? 'text-[var(--trade-green)]' : 'text-green-600';
  const pnlNegative = isTradePanel ? 'text-[var(--trade-red)]' : 'text-red-600';

  const tradeNumericCell = isTradePanel ? 'font-mono tabular-nums' : '';

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
        className={cn(
          'flex flex-col',
          isEmbeddedTrade &&
            cn(
              TRADE_ROOM_EMBEDDED_TABLE_CARD_CLASS,
              'h-full min-h-0 flex-1 overflow-hidden'
            ),
          isTradePanel && !isEmbeddedTrade && TRADE_ROOM_CARD_CLASS
        )}
      >
        <CardContent
          className={cn(
            'flex flex-col items-center justify-center py-12',
            isTradePanel && 'px-4 text-xs text-[var(--trade-text-muted)]'
          )}
        >
          <IconLoader2
            className={cn(
              'mb-4 h-6 w-6 animate-spin',
              isTradePanel
                ? 'text-[var(--trade-text-muted)]'
                : 'text-muted-foreground'
            )}
          />
          <p className='text-center'>Loading room trading positions...</p>
        </CardContent>
      </Card>
    );
  }

  if (positions.length === 0 && (!pagination || pagination.total === 0)) {
    return (
      <Card
        className={cn(
          'flex flex-col',
          isEmbeddedTrade &&
            cn(
              TRADE_ROOM_EMBEDDED_TABLE_CARD_CLASS,
              'h-full min-h-0 flex-1 overflow-hidden'
            ),
          isTradePanel && !isEmbeddedTrade && TRADE_ROOM_CARD_CLASS
        )}
      >
        <CardContent
          className={cn(
            'flex flex-col items-center justify-center py-12',
            isTradePanel && 'px-4 text-xs text-[var(--trade-text-muted)]'
          )}
        >
          <p className='text-center'>
            No room trading positions found. Positions will appear here once you
            start trading.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'flex flex-col overflow-hidden',
        isEmbeddedTrade
          ? cn(
              TRADE_ROOM_EMBEDDED_TABLE_CARD_CLASS,
              'h-full min-h-0 min-w-0 flex-1'
            )
          : 'max-h-[min(70vh,520px)]',
        isTradePanel && !isEmbeddedTrade && TRADE_ROOM_CARD_CLASS
      )}
    >
      <CardContent
        className={cn(
          'flex min-h-[240px] min-w-0 flex-1 flex-col overflow-hidden',
          isEmbeddedTrade
            ? cn(
                'px-4 pt-0',
                pagination && pagination.total > 0 ? 'pb-2' : 'pb-6'
              )
            : isTradePanel
              ? cn(
                  'px-4 pt-3',
                  pagination && pagination.total > 0 ? 'pb-2' : 'pb-4'
                )
              : cn('pt-6', pagination && pagination.total > 0 ? 'pb-2' : 'pb-6')
        )}
      >
        <div
          className={cn(
            'relative flex min-h-0 flex-1 flex-col',
            isEmbeddedTrade ? 'min-w-0' : 'min-h-[200px]'
          )}
        >
          <div className='relative flex min-h-0 min-w-0 flex-1'>
            <div
              className={cn(
                'absolute inset-0 min-h-0 min-w-0 overflow-auto rounded-lg border',
                isTradePanel &&
                  (isEmbeddedTrade
                    ? 'rounded-none border-0 bg-transparent'
                    : 'rounded-md border-[var(--trade-border)] bg-[var(--trade-dark)]/20')
              )}
            >
              <Table
                className={cn(
                  isTradePanel &&
                    'text-xs text-[var(--trade-text)] [&_td]:text-[var(--trade-text)]'
                )}
              >
                  <TableHeader
                    className={cn(
                      'sticky top-0 z-10',
                      isTradePanel
                        ? 'border-b border-[var(--trade-border)] bg-[var(--trade-panel)] [&_th]:h-9 [&_th]:px-2 [&_th]:text-[10px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-[var(--trade-text-muted)]'
                        : 'bg-muted'
                    )}
                  >
                    <TableRow
                      className={cn(
                        isTradePanel &&
                          'border-[var(--trade-border)] hover:bg-transparent'
                      )}
                    >
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
                  <TableBody
                    className={cn(
                      isTradePanel && '[&_tr]:border-[var(--trade-border)]/70'
                    )}
                  >
                    {positions.length === 0 &&
                    pagination &&
                    pagination.total > 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={13}
                          className={cn('py-8 text-center', mutedCell)}
                        >
                          No positions on this page.
                        </TableCell>
                      </TableRow>
                    ) : (
                      positions.map((position) => (
                      <TableRow
                        key={position.id}
                        className={cn(
                          isTradePanel &&
                            'border-[var(--trade-border)]/80 hover:bg-[var(--trade-dark)]/40'
                        )}
                      >
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
                              <div
                                className={cn('text-sm', mutedCell)}
                              >
                                {position.market.name}
                              </div>
                            </div>
                          ) : (
                            <span className={mutedCell}>-</span>
                          )}
                        </TableCell>
                        <TableCell
                          className={cn('text-xs', tradeNumericCell)}
                        >
                          {position.quantity
                            ? parseFloat(position.quantity.toString())
                            : '-'}
                        </TableCell>
                        <TableCell
                          className={cn('text-xs', tradeNumericCell)}
                        >
                          {position.executedPrice
                            ? `$${position.executedPrice.toFixed(2)}`
                            : '-'}
                        </TableCell>
                        <TableCell
                          className={cn('text-xs', tradeNumericCell)}
                        >
                          {position.closedPrice
                            ? `$${position.closedPrice.toFixed(2)}`
                            : '-'}
                        </TableCell>
                        <TableCell
                          className={cn('text-xs', tradeNumericCell)}
                        >
                          {position.takeProfit
                            ? `$${position.takeProfit.toFixed(2)}`
                            : '-'}
                        </TableCell>
                        <TableCell
                          className={cn('text-xs', tradeNumericCell)}
                        >
                          {position.stopLoss
                            ? `$${position.stopLoss.toFixed(2)}`
                            : '-'}
                        </TableCell>
                        <TableCell
                          className={cn('text-xs', tradeNumericCell)}
                        >
                          {position.requiredMargin
                            ? `$${position.requiredMargin.toFixed(2)}`
                            : '-'}
                        </TableCell>
                        <TableCell
                          className={cn('text-xs', tradeNumericCell)}
                        >
                          {(() => {
                            // For non-placed positions, always show position.pnl
                            if (position.status !== 'PLACED') {
                              const pnl = position.pnl || 0;
                              return (
                                <span
                                  className={
                                    pnl >= 0 ? pnlPositive : pnlNegative
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
                                    ? pnlPositive
                                    : pnlNegative
                                }
                              >
                                {displayPnL >= 0 ? '+' : ''}$
                                {displayPnL.toFixed(2)}
                                {isLive && (
                                  <span
                                    className={cn(
                                      'ml-1 text-xs',
                                      mutedCell
                                    )}
                                  >
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
                            className={cn(
                              'text-xs',
                              isTradePanel && 'text-[10px] font-semibold tracking-wide'
                            )}
                          >
                            {position.status}
                          </Badge>
                        </TableCell>
                        <TableCell className={cn('text-xs', mutedCell)}>
                          {formatDate(position.executedAt || new Date())}
                        </TableCell>
                        <TableCell className={cn('text-xs', mutedCell)}>
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
                                  className={cn(
                                    isTradePanel &&
                                      'h-8 border-[var(--trade-border)] bg-transparent text-xs text-[var(--trade-text)] hover:bg-[var(--trade-dark)]/50'
                                  )}
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
                                    className={
                                      isTradePanel
                                        ? 'bg-[var(--trade-red)] hover:opacity-90'
                                        : 'bg-red-600 hover:bg-red-700'
                                    }
                                  >
                                    Close Position
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <span className={cn('text-sm', mutedCell)}>
                              {position.status === 'CLOSED'
                                ? 'Closed'
                                : 'Closed'}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
            </div>
          </div>
          {pagination && pagination.total > 0 ? (
            <div
              className={cn(
                'flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-1 py-2',
                isTradePanel
                  ? 'border-[var(--trade-border)] bg-[var(--trade-panel)]'
                  : 'border-border bg-muted/30'
              )}
            >
              <div className='flex items-center gap-2'>
                <span
                  className={cn(
                    'whitespace-nowrap text-xs',
                    isTradePanel
                      ? 'text-[var(--trade-text-muted)]'
                      : 'text-muted-foreground'
                  )}
                >
                  Rows per page
                </span>
                <Select
                  value={String(pagination.pageSize)}
                  onValueChange={(v) =>
                    pagination.onPageSizeChange(Number(v))
                  }
                >
                  <SelectTrigger
                    size='sm'
                    className={cn(
                      'h-8 w-[4.25rem] text-xs',
                      isTradePanel &&
                        'border-[var(--trade-border)] bg-[var(--trade-dark)]/40 text-[var(--trade-text)]'
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITION_PAGE_SIZE_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='flex items-center gap-2'>
                <span
                  className={cn(
                    'tabular-nums text-xs',
                    isTradePanel
                      ? 'text-[var(--trade-text-muted)]'
                      : 'text-muted-foreground'
                  )}
                >
                  {pagination.total === 0
                    ? '0 of 0'
                    : (() => {
                        const from =
                          (pagination.page - 1) * pagination.pageSize + 1;
                        const to = Math.min(
                          pagination.page * pagination.pageSize,
                          pagination.total
                        );
                        return `${from}–${to} of ${pagination.total}`;
                      })()}
                </span>
                <div className='flex items-center gap-1'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className={cn(
                      'h-8 w-8 p-0',
                      isTradePanel &&
                        'border-[var(--trade-border)] bg-transparent text-[var(--trade-text)] hover:bg-[var(--trade-dark)]/50'
                    )}
                    disabled={pagination.page <= 1}
                    onClick={() =>
                      pagination.onPageChange(pagination.page - 1)
                    }
                    aria-label='Previous page'
                  >
                    <IconChevronLeft className='h-4 w-4' />
                  </Button>
                  <span
                    className={cn(
                      'min-w-[4.5rem] text-center text-xs tabular-nums',
                      isTradePanel
                        ? 'text-[var(--trade-text)]'
                        : 'text-foreground'
                    )}
                  >
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className={cn(
                      'h-8 w-8 p-0',
                      isTradePanel &&
                        'border-[var(--trade-border)] bg-transparent text-[var(--trade-text)] hover:bg-[var(--trade-dark)]/50'
                    )}
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() =>
                      pagination.onPageChange(pagination.page + 1)
                    }
                    aria-label='Next page'
                  >
                    <IconChevronRight className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

/** Tab filter maps to PositionStatus: open=PLACED, pending=PENDING, closed=CLOSED+FAILED */
export type PositionTabFilter = 'open' | 'pending' | 'closed';

/**
 * Standalone card component that fetches room trading positions and renders
 * the table (e.g. at the bottom of the trading view page).
 * @param statusFilter - Filter by position status tab: open (PLACED), pending (PENDING), closed (CLOSED, FAILED)
 */
interface UserPositionsTableCardRoomTradingProps {
  statusFilter?: PositionTabFilter;
  room?: Room;
  refreshEventName?: string;
  panelVariant?: 'default' | 'trade';
  embeddedInTradePanel?: boolean;
}

export function UserPositionsTableCardRoomTrading({
  statusFilter = 'open',
  room = 'TRADING',
  refreshEventName = 'room-trading-positions-refresh',
  panelVariant = 'default',
  embeddedInTradePanel = false
}: UserPositionsTableCardRoomTradingProps) {
  const balanceType = room === 'INSTITUTIONAL' ? 'INSTITUTIONAL' : 'REAL';
  const [positions, setPositions] = useState<PositionWithMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realTimePnL, setRealTimePnL] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paginationMeta, setPaginationMeta] = useState<{
    total: number;
    pages: number;
  } | null>(null);

  useEffect(() => {
    setPage(1);
  }, [pageSize, statusFilter, room]);

  const loadPositions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
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
      const p = data.pagination;
      if (
        p &&
        typeof p.total === 'number' &&
        typeof p.pages === 'number'
      ) {
        setPaginationMeta({
          total: p.total,
          pages: Math.max(1, p.pages)
        });
      } else {
        setPaginationMeta(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load positions');
    } finally {
      setLoading(false);
    }
  }, [room, balanceType, statusFilter, page, pageSize]);

  useEffect(() => {
    loadPositions();
  }, [loadPositions]);

  useEffect(() => {
    if (
      paginationMeta &&
      page > paginationMeta.pages &&
      paginationMeta.pages >= 1
    ) {
      setPage(paginationMeta.pages);
    }
  }, [paginationMeta, page]);

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
    const isTrade = panelVariant === 'trade';
    const embedded = embeddedInTradePanel && isTrade;
    return (
      <Card
        className={cn(
          'flex flex-col',
          embedded &&
            cn(
              TRADE_ROOM_EMBEDDED_TABLE_CARD_CLASS,
              'h-full min-h-0 flex-1 overflow-hidden'
            ),
          isTrade && !embedded && TRADE_ROOM_CARD_CLASS
        )}
      >
        <CardContent
          className={cn(
            'flex items-center justify-center py-8',
            isTrade && 'px-4 text-xs'
          )}
        >
          <p
            className={cn(
              'text-sm',
              isTrade ? 'text-[var(--trade-red)]' : 'text-destructive'
            )}
          >
            {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  const paginationProp: PositionsTablePagination | undefined =
    !loading && !error && paginationMeta
      ? {
          page,
          pageSize,
          total: paginationMeta.total,
          totalPages: paginationMeta.pages,
          onPageChange: setPage,
          onPageSizeChange: setPageSize
        }
      : undefined;

  return (
    <UserPositionsTableRoomTrading
      positions={positions}
      loading={loading}
      onClose={handleClosePosition}
      onUpdateRealTimePnL={updateRealTimePnL}
      realTimePnL={realTimePnL}
      panelVariant={panelVariant}
      embeddedInTradePanel={embeddedInTradePanel}
      pagination={paginationProp}
    />
  );
}

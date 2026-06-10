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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { Market, Position } from '@/lib/prisma/generated/client';
import { useMarketsWebSocket } from '@/contexts/markets-websocket-context';
import { calculatePnLClient } from '@/lib/calculator-client';
import {
  IconLoader2,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconChevronLeft,
  IconChevronRight,
  IconX
} from '@tabler/icons-react';
import { toast } from 'sonner';
import type { Room } from '@/lib/prisma/generated/client';
import { cn } from '@/lib/utils';
import {
  TRADE_ROOM_CARD_CLASS,
  TRADE_ROOM_EMBEDDED_TABLE_CARD_CLASS
} from '@/constants/trade-room-ui';
import { useTranslations } from 'next-intl';
import { useTradeBalanceSelection } from '@/hooks/use-trade-balance-selection';

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
  onUpdateRealTimePnL?: (positionId: string, pnl: number) => void;
  realTimePnL?: Record<string, number>;
  onClosePosition?: (positionId: string) => void | Promise<void>;
  closingPositionIds?: Record<string, boolean>;
  /** Match `/trade` trade-room panel typography and colors */
  panelVariant?: 'default' | 'trade';
  /** When true with `trade`, omit nested card chrome (trade room bottom tabs panel). */
  embeddedInTradePanel?: boolean;
  /** Trade-room bottom panel: show close control for PLACED / PENDING rows. */
  showCloseAction?: boolean;
  onAfterClose?: () => void;
  pagination?: PositionsTablePagination;
}
export function UserPositionsTableRoomTrading({
  positions,
  loading,
  onUpdateRealTimePnL,
  onClosePosition,
  closingPositionIds,
  panelVariant = 'default',
  embeddedInTradePanel = false,
  showCloseAction = false,
  onAfterClose,
  pagination
}: UserPositionsTableRoomTradingProps) {
  const isTradePanel = panelVariant === 'trade';
  const t = useTranslations('Trade.positions');
  const isEmbeddedTrade = isTradePanel && embeddedInTradePanel;
  const [closingId, setClosingId] = useState<string | null>(null);
  const pageSizeForHeight = pagination?.pageSize ?? positions.length ?? 10;
  const shouldExpandForPageSize = !isTradePanel && Boolean(pagination);
  const dynamicMinHeight = shouldExpandForPageSize
    ? `${Math.max(320, pageSizeForHeight * 48 + 176)}px`
    : undefined;

  const col = (key: Parameters<typeof t>[0], fallback: string) =>
    isTradePanel ? t(key) : fallback;

  const canCloseStatus = (status: string) =>
    status === 'PLACED' || status === 'PENDING';

  const handleClosePosition = async (positionId: string) => {
    setClosingId(positionId);
    try {
      const res = await fetch(`/api/user/positions/${positionId}/close`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CLOSED' })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data?.error === 'string' ? data.error : 'Failed to close position'
        );
      }
      toast.success('Position closed');
      onAfterClose?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to close position');
    } finally {
      setClosingId(null);
    }
  };

  const colCount = showCloseAction ? 13 : 12;
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
        style={dynamicMinHeight ? { minHeight: dynamicMinHeight } : undefined}
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
          <p className='text-center'>
            {col('loading', 'Loading room trading positions...')}
          </p>
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
        style={dynamicMinHeight ? { minHeight: dynamicMinHeight } : undefined}
      >
        <CardContent
          className={cn(
            'flex flex-col items-center justify-center py-12',
            isTradePanel && 'px-4 text-xs text-[var(--trade-text-muted)]'
          )}
        >
          <p className='text-center'>
            {col(
              'empty',
              'No room trading positions found. Positions will appear here once you start trading.'
            )}
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
          : 'min-w-0',
        isTradePanel && !isEmbeddedTrade && TRADE_ROOM_CARD_CLASS
      )}
      style={dynamicMinHeight ? { minHeight: dynamicMinHeight } : undefined}
    >
      <CardContent
        className={cn(
          'flex min-w-0 flex-1 flex-col overflow-hidden',
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
            isEmbeddedTrade ? 'min-w-0' : 'min-h-0'
          )}
          style={dynamicMinHeight ? { minHeight: dynamicMinHeight } : undefined}
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
                      <TableHead>{col('type', 'Type')}</TableHead>
                      <TableHead>{col('market', 'Market')}</TableHead>
                      <TableHead>{col('quantity', 'Quantity')}</TableHead>
                      <TableHead>{col('execPrice', 'Exec Price')}</TableHead>
                      <TableHead>{col('closedPrice', 'Closed Price')}</TableHead>
                      <TableHead>{col('takeProfit', 'Take Profit')}</TableHead>
                      <TableHead>{col('stopLoss', 'Stop Loss')}</TableHead>
                      <TableHead>{col('value', 'Value')}</TableHead>
                      <TableHead>{col('pnl', 'P&L')}</TableHead>
                      <TableHead>{col('status', 'Status')}</TableHead>
                      <TableHead>{col('date', 'Date')}</TableHead>
                      <TableHead>{col('closed', 'Closed')}</TableHead>
                      {showCloseAction ? (
                        <TableHead className="text-right">{col('close', 'Close')}</TableHead>
                      ) : null}
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
                          colSpan={colCount}
                          className={cn('py-8 text-center', mutedCell)}
                        >
                          {col('emptyPage', 'No positions on this page.')}
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
                            ? position.executedPrice.toFixed(2)
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
                            ? position.takeProfit.toFixed(2)
                            : '-'}
                        </TableCell>
                        <TableCell
                          className={cn('text-xs', tradeNumericCell)}
                        >
                          {position.stopLoss
                            ? position.stopLoss.toFixed(2)
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
                        {showCloseAction ? (
                          <TableCell className="p-1 text-right align-middle">
                            {canCloseStatus(position.status) ? (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                      'h-7 gap-1 px-2 text-[10px]',
                                      isTradePanel &&
                                        'border-[var(--trade-border)] bg-transparent text-[var(--trade-text)] hover:bg-[var(--trade-dark)]/50'
                                    )}
                                    disabled={
                                      closingId === position.id ||
                                      Boolean(closingPositionIds?.[position.id])
                                    }
                                  >
                                    {closingId === position.id ||
                                    Boolean(closingPositionIds?.[position.id]) ? (
                                      <IconLoader2 className="size-3.5 animate-spin" />
                                    ) : (
                                      <IconX className="size-3.5" />
                                    )}
                                    {closingId === position.id ||
                                    Boolean(closingPositionIds?.[position.id])
                                      ? col('closing', 'Closing...')
                                      : col('close', 'Close')}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent
                                  className={
                                    isTradePanel
                                      ? 'border-[var(--trade-border)] bg-[var(--trade-panel)] text-[var(--trade-text)]'
                                      : undefined
                                  }
                                >
                                  <AlertDialogHeader>
                                    <AlertDialogTitle
                                      className={
                                        isTradePanel
                                          ? 'text-[var(--trade-text)]'
                                          : undefined
                                      }
                                    >
                                      {col('closePosition', 'Close position')}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription
                                      className={
                                        isTradePanel
                                          ? 'text-[var(--trade-text-muted)]'
                                          : undefined
                                      }
                                    >
                                      {isTradePanel
                                        ? t('closePositionConfirm', {
                                            type: position.type,
                                            symbol:
                                              position.market?.symbol ?? 'this market'
                                          })
                                        : `Close this ${position.type} position for ${position.market?.symbol ?? 'this market'}? This cannot be undone.`}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel
                                      className={
                                        isTradePanel
                                          ? 'border-[var(--trade-border)] bg-transparent text-[var(--trade-text)] hover:bg-[var(--trade-dark)]/50'
                                          : undefined
                                      }
                                    >
                                      {col('cancel', 'Cancel')}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 hover:bg-red-700"
                                      onClick={() => {
                                        if (onClosePosition) {
                                          void Promise.resolve(
                                            onClosePosition(position.id)
                                          );
                                          return;
                                        }
                                        void handleClosePosition(position.id);
                                      }}
                                    >
                                      {col('closePositionAction', 'Close position')}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            ) : (
                              <span className={mutedCell}>—</span>
                            )}
                          </TableCell>
                        ) : null}
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
  const { selectedBalanceType } = useTradeBalanceSelection();
  const balanceType = selectedBalanceType;
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
  const [closingPositionIds, setClosingPositionIds] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    setPage(1);
  }, [pageSize, statusFilter, room, balanceType]);

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

  const updateRealTimePnL = useCallback((positionId: string, pnl: number) => {
    setRealTimePnL((prev) => ({ ...prev, [positionId]: pnl }));
  }, []);

  const handleClosePosition = useCallback(
    async (positionId: string) => {
      try {
        setClosingPositionIds((prev) => ({ ...prev, [positionId]: true }));
        const response = await fetch(`/api/user/positions/${positionId}/close`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'CLOSED'
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to close position');
        }

        toast.success('Position closed successfully');
        await loadPositions();
        window.dispatchEvent(new CustomEvent(refreshEventName));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to close position'
        );
      } finally {
        setClosingPositionIds((prev) => {
          const next = { ...prev };
          delete next[positionId];
          return next;
        });
      }
    },
    [loadPositions, refreshEventName]
  );

  const handleAfterClose = useCallback(() => {
    void loadPositions();
    window.dispatchEvent(new CustomEvent(refreshEventName));
  }, [loadPositions, refreshEventName]);

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

  const showCloseAction =
    panelVariant === 'trade' &&
    embeddedInTradePanel &&
    (statusFilter === 'open' || statusFilter === 'pending');

  return (
    <UserPositionsTableRoomTrading
      positions={positions}
      loading={loading}
      onUpdateRealTimePnL={updateRealTimePnL}
      realTimePnL={realTimePnL}
      onClosePosition={handleClosePosition}
      closingPositionIds={closingPositionIds}
      panelVariant={panelVariant}
      embeddedInTradePanel={embeddedInTradePanel}
      showCloseAction={showCloseAction}
      onAfterClose={handleAfterClose}
      pagination={paginationProp}
    />
  );
}

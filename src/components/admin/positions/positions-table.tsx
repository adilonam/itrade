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
import { ScrollArea } from '@/components/ui/scroll-area';
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
  PositionType,
  PositionStatus,
  Position,
  Market,
  User
} from '@/lib/prisma/generated/client';

// Extended position type with relations (admin list adds calculated PnL for open legs)
export type PositionWithRelations = Position & {
  user: User | null;
  market: Market | null;
  calculatedPnL?: number | null;
};
import {
  IconEdit,
  IconTrash,
  IconTrendingUp,
  IconTrendingDown
} from '@tabler/icons-react';
import { TRADE_ROOM_CARD_CLASS } from '@/constants/trade-room-ui';

interface PositionsTableProps {
  positions: PositionWithRelations[];
  loading: boolean;
  onEdit: (position: PositionWithRelations) => void;
  onDelete: () => void;
  /** Hide edit/delete; use on admin user edit and similar read-only embeds */
  readOnly?: boolean;
  /** Single-user context: drop the User column */
  omitUserColumn?: boolean;
  cardDescription?: string;
  /** Subtitle when the table has rows (default: manage-all-users copy) */
  noPositionsHint?: string;
  /** Smaller min-height for embedded layouts */
  compact?: boolean;
}

export function PositionsTable({
  positions,
  loading,
  onEdit,
  onDelete,
  readOnly = false,
  omitUserColumn = false,
  cardDescription,
  noPositionsHint,
  compact = false
}: PositionsTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const description =
    cardDescription ??
    (readOnly
      ? 'Open and closed positions for this user'
      : 'Manage and monitor all user positions');

  const emptyHint =
    noPositionsHint ??
    (readOnly
      ? 'This user has no positions yet.'
      : 'No positions match your current filters.');

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

  const getTypeColor = (type: PositionType) => {
    switch (type) {
      case 'BUY':
        return 'border-[var(--trade-green)]/40 bg-[var(--trade-green)]/15 text-[var(--trade-green)]';
      case 'SELL':
        return 'border-[var(--trade-red)]/40 bg-[var(--trade-red)]/15 text-[var(--trade-red)]';
      default:
        return 'border-[var(--trade-border)] bg-[var(--trade-dark)] text-[var(--trade-text-muted)]';
    }
  };

  const getStatusColor = (status: PositionStatus) => {
    switch (status) {
      case 'CLOSED':
        return 'border-[var(--trade-green)]/40 bg-[var(--trade-green)]/15 text-[var(--trade-green)]';
      case 'PLACED':
        return 'border-amber-400/40 bg-amber-400/15 text-amber-400';
      case 'FAILED':
        return 'border-[var(--trade-red)]/40 bg-[var(--trade-red)]/15 text-[var(--trade-red)]';
      case 'PENDING':
        return 'border-[var(--trade-accent-blue)]/40 bg-[var(--trade-accent-blue)]/15 text-[var(--trade-accent-blue)]';
      default:
        return 'border-[var(--trade-border)] bg-[var(--trade-dark)] text-[var(--trade-text-muted)]';
    }
  };

  const handleDelete = async (id: string) => {
    if (readOnly) return;
    try {
      setDeletingId(id);
      const response = await fetch(`/api/admin/positions/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete position');
      }

      onDelete();
    } catch {
      // Error handled via onDelete callback
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <Card className={TRADE_ROOM_CARD_CLASS}>
        <CardHeader className='px-4 pb-0 pt-0'>
          <CardTitle className='text-sm font-semibold'>Positions</CardTitle>
          <CardDescription className='text-xs text-[var(--trade-text-muted)]'>
            Loading positions…
          </CardDescription>
        </CardHeader>
        <CardContent className='px-4'>
          <div className='flex items-center justify-center py-8'>
            <div className='h-8 w-8 animate-spin rounded-full border-2 border-[var(--trade-border)] border-b-[var(--trade-accent-blue)]'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (positions.length === 0) {
    return (
      <Card className={TRADE_ROOM_CARD_CLASS}>
        <CardHeader className='px-4 pb-0 pt-0'>
          <CardTitle className='text-sm font-semibold'>Positions</CardTitle>
          <CardDescription className='text-xs text-[var(--trade-text-muted)]'>
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className='px-4'>
          <div className='py-8 text-center text-xs text-[var(--trade-text-muted)]'>
            {emptyHint}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={TRADE_ROOM_CARD_CLASS}>
      <CardHeader className='px-4 pb-0 pt-0'>
        <CardTitle className='text-sm font-semibold'>Positions</CardTitle>
        <CardDescription className='text-xs text-[var(--trade-text-muted)]'>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className='px-4'>
        <div
          className={
            compact
              ? 'relative flex min-h-[280px] flex-col'
              : 'relative flex min-h-[600px] flex-col'
          }
        >
          <div className='flex flex-1 flex-col space-y-4'>
            <div className='relative flex flex-1'>
              <div className='absolute inset-0 flex overflow-hidden rounded-lg border border-[var(--trade-border)]'>
                <ScrollArea className='h-full w-full' horizontal>
                  <Table>
                    <TableHeader className='sticky top-0 z-10 border-b border-[var(--trade-border)] bg-[var(--trade-dark)]/80'>
                      <TableRow className='border-[var(--trade-border)] hover:bg-transparent'>
                        <TableHead className='text-xs font-medium text-[var(--trade-text-muted)]'>
                          ID
                        </TableHead>
                        {!omitUserColumn ? (
                          <TableHead className='text-xs font-medium text-[var(--trade-text-muted)]'>
                            User
                          </TableHead>
                        ) : null}
                        <TableHead className='text-xs font-medium text-[var(--trade-text-muted)]'>
                          Type
                        </TableHead>
                        <TableHead className='text-xs font-medium text-[var(--trade-text-muted)]'>
                          Status
                        </TableHead>
                        <TableHead className='text-xs font-medium text-[var(--trade-text-muted)]'>
                          Room
                        </TableHead>
                        <TableHead className='text-xs font-medium text-[var(--trade-text-muted)]'>
                          Market
                        </TableHead>
                        <TableHead className='text-xs font-medium text-[var(--trade-text-muted)]'>
                          Quantity
                        </TableHead>
                        <TableHead className='text-xs font-medium text-[var(--trade-text-muted)]'>
                          Exec Price
                        </TableHead>
                        <TableHead className='text-xs font-medium text-[var(--trade-text-muted)]'>
                          Closed Price
                        </TableHead>
                        <TableHead className='text-xs font-medium text-[var(--trade-text-muted)]'>
                          TP
                        </TableHead>
                        <TableHead className='text-xs font-medium text-[var(--trade-text-muted)]'>
                          SL
                        </TableHead>
                        <TableHead className='text-xs font-medium text-[var(--trade-text-muted)]'>
                          P&L
                        </TableHead>
                        <TableHead className='text-xs font-medium text-[var(--trade-text-muted)]'>
                          Open date
                        </TableHead>
                        <TableHead className='text-xs font-medium text-[var(--trade-text-muted)]'>
                          Close date
                        </TableHead>
                        {!readOnly ? (
                          <TableHead className='text-xs font-medium text-[var(--trade-text-muted)]'>
                            Actions
                          </TableHead>
                        ) : null}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {positions.map((position) => (
                        <TableRow
                          key={position.id}
                          className='border-[var(--trade-border)] hover:bg-[var(--trade-dark)]/30'
                        >
                          <TableCell className='font-mono text-xs text-[var(--trade-text)]'>
                            {position.id.slice(0, 8)}...
                          </TableCell>
                          {!omitUserColumn ? (
                            <TableCell className='text-[var(--trade-text)]'>
                              <div>
                                <div className='text-sm font-medium'>
                                  {position.user?.name || 'N/A'}
                                </div>
                                <div className='text-xs text-[var(--trade-text-muted)]'>
                                  {position.user?.email}
                                </div>
                              </div>
                            </TableCell>
                          ) : null}
                          <TableCell>
                            <Badge className={getTypeColor(position.type)}>
                              {position.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(position.status)}>
                              {position.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant='outline'>{position.room}</Badge>
                          </TableCell>
                          <TableCell className='text-[var(--trade-text)]'>
                            {position.market ? (
                              <div>
                                <div className='text-sm font-medium'>
                                  {position.market.symbol}
                                </div>
                                <div className='text-xs text-[var(--trade-text-muted)]'>
                                  {position.market.name}
                                </div>
                              </div>
                            ) : (
                              <span className='text-[var(--trade-text-muted)]'>N/A</span>
                            )}
                          </TableCell>
                          <TableCell className='font-mono text-xs text-[var(--trade-text)]'>
                            {position.quantity
                              ? position.quantity.toFixed(4)
                              : 'N/A'}
                          </TableCell>
                          <TableCell className='font-mono text-xs text-[var(--trade-text)]'>
                            {position.executedPrice
                              ? `$${position.executedPrice.toFixed(2)}`
                              : 'N/A'}
                          </TableCell>
                          <TableCell className='font-mono text-xs text-[var(--trade-text)]'>
                            {position.closedPrice
                              ? `$${position.closedPrice.toFixed(2)}`
                              : 'N/A'}
                          </TableCell>
                          <TableCell className='font-mono text-xs text-[var(--trade-text)]'>
                            {position.takeProfit != null
                              ? `$${position.takeProfit.toFixed(2)}`
                              : '—'}
                          </TableCell>
                          <TableCell className='font-mono text-xs text-[var(--trade-text)]'>
                            {position.stopLoss != null
                              ? `$${position.stopLoss.toFixed(2)}`
                              : '—'}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const pnlValue =
                                position.pnl !== null &&
                                position.pnl !== undefined
                                  ? position.pnl
                                  : position.calculatedPnL !== null &&
                                      position.calculatedPnL !== undefined
                                    ? position.calculatedPnL
                                    : null;
                              if (pnlValue === null) {
                                return (
                                  <span className='text-xs text-[var(--trade-text-muted)]'>
                                    N/A
                                  </span>
                                );
                              }
                              return (
                                <div
                                  className={`flex items-center gap-1 font-mono text-xs ${
                                    pnlValue > 0
                                      ? 'text-[var(--trade-green)]'
                                      : pnlValue < 0
                                        ? 'text-[var(--trade-red)]'
                                        : 'text-[var(--trade-text-muted)]'
                                  }`}
                                >
                                  {pnlValue > 0 ? (
                                    <IconTrendingUp className='h-3 w-3' />
                                  ) : pnlValue < 0 ? (
                                    <IconTrendingDown className='h-3 w-3' />
                                  ) : null}
                                  {formatCurrency(pnlValue)}
                                </div>
                              );
                            })()}
                          </TableCell>
                          <TableCell className='text-xs text-[var(--trade-text-muted)]'>
                            {position.executedAt
                              ? formatDate(position.executedAt)
                              : 'N/A'}
                          </TableCell>
                          <TableCell className='text-xs text-[var(--trade-text-muted)]'>
                            {position.closedAt
                              ? formatDate(position.closedAt)
                              : 'N/A'}
                          </TableCell>
                          {!readOnly ? (
                            <TableCell>
                              <div className='flex items-center gap-2'>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() => onEdit(position)}
                                >
                                  <IconEdit className='h-3 w-3' />
                                </Button>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant='outline'
                                      size='sm'
                                      disabled={deletingId === position.id}
                                    >
                                      <IconTrash className='h-3 w-3' />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete Position
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this
                                        position? This action cannot be undone.
                                        <br />
                                        <br />
                                        <strong>Position ID:</strong>{' '}
                                        {position.id}
                                        <br />
                                        <strong>Type:</strong> {position.type}
                                        <br />
                                        <strong>Quantity:</strong>{' '}
                                        {position.quantity
                                          ? position.quantity.toFixed(4)
                                          : 'N/A'}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleDelete(position.id)
                                        }
                                        className='bg-red-600 hover:bg-red-700'
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          ) : null}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

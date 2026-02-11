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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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

// Extended position type with relations
type PositionWithRelations = Position & {
  user: User | null;
  market: Market | null;
};
import {
  IconEdit,
  IconTrash,
  IconEye,
  IconTrendingUp,
  IconTrendingDown
} from '@tabler/icons-react';

interface PositionsTableProps {
  positions: PositionWithRelations[];
  loading: boolean;
  onEdit: (position: PositionWithRelations) => void;
  onDelete: () => void;
}

export function PositionsTable({
  positions,
  loading,
  onEdit,
  onDelete
}: PositionsTableProps) {
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

  const getTypeColor = (type: PositionType) => {
    switch (type) {
      case 'BUY':
        return 'bg-green-100 text-green-800';
      case 'SELL':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: PositionStatus) => {
    switch (status) {
      case 'CLOSED':
        return 'bg-green-100 text-green-800';
      case 'PLACED':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      const response = await fetch(`/api/admin/positions/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete position');
      }

      onDelete();
    } catch (error) {
      console.error('Error deleting position:', error);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Positions</CardTitle>
          <CardDescription>Loading positions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-8'>
            <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Positions</CardTitle>
          <CardDescription>No positions found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='text-muted-foreground py-8 text-center'>
            No positions match your current filters.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Positions</CardTitle>
        <CardDescription>Manage and monitor all user positions</CardDescription>
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
                        <TableHead>ID</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Market</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Exec Price</TableHead>
                        <TableHead>Closed Price</TableHead>
                        <TableHead>P&L</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Closed</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {positions.map((position) => (
                        <TableRow key={position.id}>
                          <TableCell className='font-mono text-xs'>
                            {position.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className='font-medium'>
                                {position.user?.name || 'N/A'}
                              </div>
                              <div className='text-muted-foreground text-sm'>
                                {position.user?.email}
                              </div>
                            </div>
                          </TableCell>
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
                              <span className='text-muted-foreground'>N/A</span>
                            )}
                          </TableCell>
                          <TableCell className='font-mono text-xs'>
                            {position.quantity
                              ? position.quantity.toFixed(4)
                              : 'N/A'}
                          </TableCell>
                          <TableCell className='text-xs'>
                            {position.executedPrice
                              ? `$${position.executedPrice.toFixed(2)}`
                              : 'N/A'}
                          </TableCell>
                          <TableCell className='text-xs'>
                            {position.closedPrice
                              ? `$${position.closedPrice.toFixed(2)}`
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {position.pnl !== null ? (
                              <div
                                className={`flex items-center gap-1 font-mono text-xs ${
                                  position.pnl > 0
                                    ? 'text-green-600'
                                    : position.pnl < 0
                                      ? 'text-red-600'
                                      : 'text-gray-600'
                                }`}
                              >
                                {position.pnl > 0 ? (
                                  <IconTrendingUp className='h-3 w-3' />
                                ) : position.pnl < 0 ? (
                                  <IconTrendingDown className='h-3 w-3' />
                                ) : null}
                                {formatCurrency(position.pnl)}
                              </div>
                            ) : (
                              <span className='text-muted-foreground text-xs'>
                                N/A
                              </span>
                            )}
                          </TableCell>
                          <TableCell className='text-xs'>
                            {formatDate(position.executedAt || new Date())}
                          </TableCell>
                          <TableCell className='text-xs'>
                            {position.closedAt
                              ? formatDate(position.closedAt)
                              : 'N/A'}
                          </TableCell>
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
                                      onClick={() => handleDelete(position.id)}
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

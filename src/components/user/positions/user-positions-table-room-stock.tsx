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
import type { Market, Position } from '@prisma/client';
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

interface UserPositionsTableRoomStockProps {
  positions: PositionWithMarket[];
  loading: boolean;
  onClose: (positionId: string) => void;
}

export function UserPositionsTableRoomStock({
  positions,
  loading,
  onClose
}: UserPositionsTableRoomStockProps) {
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
          <span className='ml-2'>Loading positions...</span>
        </CardContent>
      </Card>
    );
  }

  if (positions.length === 0) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-8'>
          <div className='text-center'>
            <p className='text-muted-foreground'>No positions found</p>
            <p className='text-muted-foreground mt-1 text-sm'>
              Your positions will appear here once you start trading
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Positions</CardTitle>
        <CardDescription>
          View and manage your trading positions
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
                    {position.quantity ? position.quantity.toFixed(4) : '-'}
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
                    {position.pnl !== null ? (
                      <span
                        className={
                          position.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }
                      >
                        {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                      </span>
                    ) : (
                      <span className='text-muted-foreground'>-</span>
                    )}
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
                    {position.closedAt ? formatDate(position.closedAt) : '-'}
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
                            <AlertDialogTitle>Close Position</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to close this{' '}
                              {position.type} position? This action cannot be
                              undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleClosePosition(position.id)}
                              className='bg-red-600 hover:bg-red-700'
                            >
                              Close Position
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <span className='text-muted-foreground text-sm'>
                        {position.status === 'CLOSED' ? 'Closed' : 'Closed'}
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

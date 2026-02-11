'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { Market, Position } from '@/lib/prisma/generated/client';
import { IconLoader2 } from '@tabler/icons-react';

type PositionWithMarket = Position & {
  market: Market | null;
};

interface UserPositionsTableRoomStockProps {
  positions: PositionWithMarket[];
  loading: boolean;
}

export function UserPositionsTableRoomStock({
  positions,
  loading
}: UserPositionsTableRoomStockProps) {
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
        <CardTitle>History</CardTitle>
        <CardDescription>View your trading history</CardDescription>
      </CardHeader>
      <CardContent className='min-w-0'>
        <ScrollArea className='w-full overflow-x-auto'>
          <div className='min-w-[800px] rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='min-w-[120px]'>Market</TableHead>
                  <TableHead className='min-w-[100px]'>Quantity</TableHead>
                  <TableHead className='min-w-[100px]'>Exec Price</TableHead>
                  <TableHead className='min-w-[100px]'>Closed Price</TableHead>
                  <TableHead className='min-w-[100px]'>Value</TableHead>
                  <TableHead className='min-w-[80px]'>P&L</TableHead>
                  <TableHead className='min-w-[80px]'>Status</TableHead>
                  <TableHead className='min-w-[120px]'>Date</TableHead>
                  <TableHead className='min-w-[120px]'>Closed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((position) => (
                  <TableRow key={position.id}>
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
                      {position.requiredMargin
                        ? `$${position.requiredMargin.toFixed(2)}`
                        : '-'}
                    </TableCell>
                    <TableCell className='text-xs'>
                      {position.pnl !== null ? (
                        <span
                          className={
                            position.pnl >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          {position.pnl >= 0 ? '+' : ''}$
                          {position.pnl.toFixed(2)}
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation='horizontal' />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

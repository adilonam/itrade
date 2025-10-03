'use client';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import type { Market } from '@prisma/client';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconWifi,
  IconWifiOff
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useMarketsWebSocket } from '@/contexts/markets-websocket-context';

interface MarketListProps {
  markets: Market[];
}

export function MarketList({ markets }: MarketListProps) {
  const router = useRouter();
  const { realTimePrices, isConnected } = useMarketsWebSocket();

  const formatNumber = (num: number) => {
    return parseFloat(num.toFixed(5)).toString();
  };

  const formatChange = (change: number) => {
    return (change >= 0 ? '+' : '') + formatNumber(change);
  };

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Market</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className='text-right'>Price</TableHead>
            <TableHead className='text-right'>24h Change</TableHead>
            <TableHead className='text-right'>24h %</TableHead>
            <TableHead className='text-right'>Bid</TableHead>
            <TableHead className='text-right'>Ask</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {markets.map((market) => {
            // Get real-time price data for this market
            const realTimeData = realTimePrices.get(market.symbol);

            // Use real-time data if available, otherwise fall back to market data
            const currentPrice = realTimeData?.price ?? market.lastPrice;
            const currentChange = realTimeData
              ? realTimeData.price - (market.lastPrice - market.lastChange)
              : market.lastChange;

            const isPositive = currentChange >= 0;
            const changeColor = isPositive ? 'text-green-600' : 'text-red-600';

            // Calculate bid/ask from real-time data or use market data
            const bidPrice = currentPrice - market.spread / 2;
            const askPrice = currentPrice + market.spread / 2;

            return (
              <TableRow
                key={market.id}
                className='hover:bg-muted/50 cursor-pointer'
                onClick={() =>
                  router.push(
                    `/dashboard/room-trading?pk=${encodeURIComponent(market.id)}`
                  )
                }
              >
                <TableCell>
                  <div className='flex items-center space-x-3'>
                    <div className='min-w-0'>
                      <div className='flex items-center space-x-2'>
                        <div className='text-sm font-semibold'>
                          {market.symbol}
                        </div>
                        {isConnected && realTimeData && (
                          <IconWifi className='h-3 w-3 text-green-500' />
                        )}
                        {isConnected && !realTimeData && (
                          <IconWifiOff className='h-3 w-3 text-yellow-500' />
                        )}
                      </div>
                      <div className='text-muted-foreground truncate text-xs'>
                        {market.name}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={'default'} className='text-xs'>
                    {market.type}
                  </Badge>
                </TableCell>
                <TableCell className='text-right font-mono'>
                  {formatNumber(currentPrice)}
                </TableCell>
                <TableCell className={cn('text-right font-mono', changeColor)}>
                  {formatChange(currentChange)}
                </TableCell>
                <TableCell className='text-right'>
                  <div
                    className={cn(
                      'flex items-center justify-end space-x-1',
                      changeColor
                    )}
                  >
                    {isPositive ? (
                      <IconTrendingUp className='h-4 w-4' />
                    ) : (
                      <IconTrendingDown className='h-4 w-4' />
                    )}
                    <span className='font-medium'>
                      {isPositive ? '+' : ''}
                      {formatNumber(currentChange * 100)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className='text-right font-mono'>
                  {formatNumber(bidPrice)}
                </TableCell>
                <TableCell className='text-right font-mono'>
                  {formatNumber(askPrice)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

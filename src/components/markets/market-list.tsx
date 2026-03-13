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
import type { Market } from '@/lib/prisma/generated/client';
import type { TwelveDataWebSocketPriceData } from '@/types/twelvedata';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconWifi
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface MarketListProps {
  markets: Market[];
  tradingRoute?: string;
  realTimePrices?: Map<string, TwelveDataWebSocketPriceData>;
  isConnected?: boolean;
}

export function MarketList({
  markets,
  tradingRoute,
  realTimePrices,
  isConnected
}: MarketListProps) {
  const router = useRouter();

  const formatNumber = (num: number) => {
    return parseFloat(num.toFixed(5)).toString();
  };

  const formatChange = (change: number) => {
    return (change >= 0 ? '+' : '') + formatNumber(change);
  };

  return (
    <div className='overflow-x-auto rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Market</TableHead>
            <TableHead className='hidden sm:table-cell'>Type</TableHead>
            <TableHead className='text-right'>Price</TableHead>
            <TableHead className='hidden text-right md:table-cell'>
              24h Change
            </TableHead>
            <TableHead className='text-right'>24h %</TableHead>
            <TableHead className='hidden text-right lg:table-cell'>
              Bid
            </TableHead>
            <TableHead className='hidden text-right lg:table-cell'>
              Ask
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {markets.map((market) => {
            // Get real-time price data for this market
            const realTimeData = realTimePrices?.get(market.symbol);

            // Use real-time data if available, otherwise fall back to market data
            const currentPrice = realTimeData?.price ?? market.lastPrice;
            const currentChange = realTimeData
              ? realTimeData.price - market.lastPreviousClose
              : market.lastChange;
            const currentPercentChange = realTimeData
              ? ((realTimeData.price - market.lastPreviousClose) /
                  market.lastPreviousClose) *
                100
              : market.lastPercentChange;

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
                    `${tradingRoute}?pk=${encodeURIComponent(market.id)}`
                  )
                }
              >
                <TableCell>
                  <div className='flex min-w-0 items-center space-x-2'>
                    {market.image && (
                      <Image
                        src={market.image}
                        alt={market.name}
                        width={24}
                        height={24}
                        className='rounded object-cover'
                      />
                    )}
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center space-x-2'>
                        <div className='truncate text-sm font-semibold'>
                          {market.symbol}
                        </div>
                        {isConnected && realTimeData && (
                          <IconWifi className='h-3 w-3 flex-shrink-0 text-green-500' />
                        )}
                        {isConnected && !realTimeData && (
                          <IconWifi className='h-3 w-3 flex-shrink-0 text-gray-400' />
                        )}
                      </div>
                      <div className='text-muted-foreground truncate text-xs'>
                        {market.name}
                      </div>
                      {/* Show type on mobile as a small badge */}
                      <div className='mt-1 sm:hidden'>
                        <Badge variant={'default'} className='text-xs'>
                          {market.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className='hidden sm:table-cell'>
                  <Badge variant={'default'} className='text-xs'>
                    {market.type}
                  </Badge>
                </TableCell>
                <TableCell className='text-right font-mono text-sm'>
                  {formatNumber(currentPrice)}
                </TableCell>
                <TableCell
                  className={cn(
                    'hidden text-right font-mono text-sm md:table-cell',
                    changeColor
                  )}
                >
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
                      <IconTrendingUp className='h-3 w-3 sm:h-4 sm:w-4' />
                    ) : (
                      <IconTrendingDown className='h-3 w-3 sm:h-4 sm:w-4' />
                    )}
                    <span className='text-xs font-medium sm:text-sm'>
                      {isPositive ? '+' : ''}
                      {currentPercentChange.toFixed(2).toString()}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className='hidden text-right font-mono text-sm lg:table-cell'>
                  {formatNumber(bidPrice)}
                </TableCell>
                <TableCell className='hidden text-right font-mono text-sm lg:table-cell'>
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

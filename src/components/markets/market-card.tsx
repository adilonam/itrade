'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Market } from '@prisma/client';
import type { TwelveDataWebSocketPriceData } from '@/types/twelvedata';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconWifi,
  IconWifiOff
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface MarketCardProps {
  market: Market;
  tradingRoute?: string;
  realTimeData?: TwelveDataWebSocketPriceData | null;
  isConnected?: boolean;
}

export function MarketCard({
  market,
  tradingRoute,
  realTimeData,
  isConnected
}: MarketCardProps) {
  // Get real-time price data for this market   lastChange = nprice - oprice , lastchagenG = Gprice -oprice   , oprice = nprice - lastChange

  // Use real-time data if available, otherwise fall back to market data
  const currentPrice = realTimeData?.price ?? market.lastPrice;
  const currentChange = realTimeData
    ? realTimeData.price - (market.lastPrice - market.lastChange)
    : market.lastChange;

  const isPositive = currentChange >= 0;
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
  const badgeVariant = isPositive ? 'default' : 'destructive';

  const formatNumber = (num: number) => {
    return parseFloat(num.toFixed(5)).toString();
  };

  // Calculate bid/ask from real-time data or use market data
  const bidPrice = currentPrice - market.spread / 2;
  const askPrice = currentPrice + market.spread / 2;

  return (
    <Card className='transition-shadow duration-200 hover:shadow-md'>
      <CardContent className='p-4'>
        <Link
          href={`${tradingRoute}?pk=${encodeURIComponent(market.id)}`}
          className='block'
        >
          <div className='mb-3 flex cursor-pointer items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <div>
                <div className='flex items-center space-x-2'>
                  <h3 className='text-sm font-semibold'>{market.symbol}</h3>
                  {isConnected && realTimeData && (
                    <div className='flex items-center'>
                      <IconWifi className='h-3 w-3 text-green-500' />
                    </div>
                  )}
                  {isConnected && !realTimeData && (
                    <div className='flex items-center'>
                      <IconWifiOff className='h-3 w-3 text-yellow-500' />
                    </div>
                  )}
                </div>
                <p className='max-w-[120px] truncate text-xs text-gray-600'>
                  {market.name}
                </p>
              </div>
            </div>
            <Badge variant={badgeVariant} className='text-xs'>
              {market.type}
            </Badge>
          </div>

          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-lg font-bold'>
                {formatNumber(currentPrice)}
              </span>
              <div className={cn('flex items-center space-x-1', changeColor)}>
                {isPositive ? (
                  <IconTrendingUp className='h-4 w-4' />
                ) : (
                  <IconTrendingDown className='h-4 w-4' />
                )}
                <span className='text-sm font-medium'>
                  {isPositive ? '+' : ''}
                  {formatNumber(currentChange * 100)}%
                </span>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-2 text-xs text-gray-600'>
              <div>
                <span className='block'>24h Change</span>
                <span className={cn('font-medium', changeColor)}>
                  {(isPositive ? '+' : '') + formatNumber(currentChange)}
                </span>
              </div>
              <div>
                <span className='block'>Price</span>
                <span className='font-medium'>
                  {formatNumber(currentPrice)}
                </span>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-2 border-t pt-2 text-xs text-gray-600'>
              <div>
                <span className='block'>Bid</span>
                <span className='font-medium'>{formatNumber(bidPrice)}</span>
              </div>
              <div>
                <span className='block'>Ask</span>
                <span className='font-medium'>{formatNumber(askPrice)}</span>
              </div>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}

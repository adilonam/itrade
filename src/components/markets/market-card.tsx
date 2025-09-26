'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Market } from '@prisma/client';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toTradingViewSymbol } from '@/lib/market-symbol';

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  const isPositive = market.lastChange >= 0;
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
  const badgeVariant = isPositive ? 'default' : 'destructive';
  const isForex = market.type.toLowerCase() === 'forex';
  const isCrypto = market.type.toLowerCase() === 'crypto';

  const formatNumber = (num: number) => {
    return parseFloat(num.toFixed(5)).toString();
  };

  // Create a temporary market object for toTradingViewSymbol
  const tempMarket = {
    symbol: market.symbol,
    type: market.type.toLowerCase() as 'forex' | 'crypto'
  };
  const targetSymbol = toTradingViewSymbol(tempMarket);

  return (
    <Card className='transition-shadow duration-200 hover:shadow-md'>
      <CardContent className='p-4'>
        <Link
          href={`/dashboard/trading-view?symbol=${encodeURIComponent(targetSymbol)}`}
          className='block'
        >
          <div className='mb-3 flex cursor-pointer items-center justify-between'>
            <div className='flex items-center space-x-2'>
              {isCrypto && (
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-100'>
                  <span className='text-xs font-bold text-gray-600'>
                    {market.symbol.slice(0, 2)}
                  </span>
                </div>
              )}
              <div>
                <h3 className='text-sm font-semibold'>{market.symbol}</h3>
                <p className='max-w-[120px] truncate text-xs text-gray-600'>
                  {market.name}
                </p>
              </div>
            </div>
            <Badge variant={badgeVariant} className='text-xs'>
              {isCrypto ? 'CRYPTO' : 'FOREX'}
            </Badge>
          </div>

          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-lg font-bold'>
                {formatNumber(market.lastPrice)}
              </span>
              <div className={cn('flex items-center space-x-1', changeColor)}>
                {isPositive ? (
                  <IconTrendingUp className='h-4 w-4' />
                ) : (
                  <IconTrendingDown className='h-4 w-4' />
                )}
                <span className='text-sm font-medium'>
                  {isPositive ? '+' : ''}
                  {formatNumber(market.lastChange * 100)}%
                </span>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-2 text-xs text-gray-600'>
              <div>
                <span className='block'>24h Change</span>
                <span className={cn('font-medium', changeColor)}>
                  {(isPositive ? '+' : '') + formatNumber(market.lastChange)}
                </span>
              </div>
              <div>
                <span className='block'>Price</span>
                <span className='font-medium'>
                  {formatNumber(market.lastPrice)}
                </span>
              </div>
            </div>

            {isForex && (
              <div className='grid grid-cols-2 gap-2 border-t pt-2 text-xs text-gray-600'>
                <div>
                  <span className='block'>Bid</span>
                  <span className='font-medium'>
                    {formatNumber(market.lastPrice - market.spread / 2)}
                  </span>
                </div>
                <div>
                  <span className='block'>Ask</span>
                  <span className='font-medium'>
                    {formatNumber(market.lastPrice + market.spread / 2)}
                  </span>
                </div>
              </div>
            )}

            {isCrypto && (
              <div className='grid grid-cols-2 gap-2 border-t pt-2 text-xs text-gray-600'>
                <div>
                  <span className='block'>Spread</span>
                  <span className='font-medium'>
                    {formatNumber(market.spread)}
                  </span>
                </div>
                <div>
                  <span className='block'>Type</span>
                  <span className='font-medium'>CRYPTO</span>
                </div>
              </div>
            )}
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}

'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Market } from '@/types';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  const isPositive = market.changePercent24h >= 0;
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
  const badgeVariant = isPositive ? 'default' : 'destructive';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: market.type === 'crypto' && price > 1 ? 2 : 4,
      maximumFractionDigits: market.type === 'crypto' && price > 1 ? 2 : 4
    }).format(price);
  };

  const formatVolume = (volume: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 2
    }).format(volume);
  };

  return (
    <Card className='transition-shadow duration-200 hover:shadow-md'>
      <CardContent className='p-4'>
        <div className='mb-3 flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            {market.type === 'crypto' && (
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
            {market.type === 'crypto' ? 'CRYPTO' : 'FOREX'}
          </Badge>
        </div>

        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <span className='text-lg font-bold'>
              {market.type === 'forex'
                ? market.price.toFixed(4)
                : formatPrice(market.price)}
            </span>
            <div className={cn('flex items-center space-x-1', changeColor)}>
              {isPositive ? (
                <IconTrendingUp className='h-4 w-4' />
              ) : (
                <IconTrendingDown className='h-4 w-4' />
              )}
              <span className='text-sm font-medium'>
                {isPositive ? '+' : ''}
                {market.changePercent24h.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-2 text-xs text-gray-600'>
            <div>
              <span className='block'>24h Change</span>
              <span className={cn('font-medium', changeColor)}>
                {market.type === 'forex'
                  ? (isPositive ? '+' : '') + market.change24h.toFixed(4)
                  : formatPrice(market.change24h)}
              </span>
            </div>
            <div>
              <span className='block'>24h Volume</span>
              <span className='font-medium'>
                {formatVolume(market.volume24h)}
              </span>
            </div>
          </div>

          {market.type === 'forex' && (
            <div className='grid grid-cols-2 gap-2 border-t pt-2 text-xs text-gray-600'>
              <div>
                <span className='block'>Bid</span>
                <span className='font-medium'>{market.bid.toFixed(4)}</span>
              </div>
              <div>
                <span className='block'>Ask</span>
                <span className='font-medium'>{market.ask.toFixed(4)}</span>
              </div>
            </div>
          )}

          {market.type === 'crypto' && (
            <div className='grid grid-cols-2 gap-2 border-t pt-2 text-xs text-gray-600'>
              <div>
                <span className='block'>Market Cap</span>
                <span className='font-medium'>
                  {market.marketCap ? formatVolume(market.marketCap) : 'N/A'}
                </span>
              </div>
              <div>
                <span className='block'>Rank</span>
                <span className='font-medium'>#{market.rank}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

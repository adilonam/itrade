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
import { Market } from '@/types';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toTradingViewSymbol } from '@/lib/market-symbol';

interface MarketListProps {
  markets: Market[];
}

export function MarketList({ markets }: MarketListProps) {
  const router = useRouter();
  const formatPrice = (price: number, type: 'crypto' | 'forex') => {
    if (type === 'forex') {
      return price.toFixed(4);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: price > 1 ? 2 : 4,
      maximumFractionDigits: price > 1 ? 2 : 4
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

  const formatChange = (change: number, type: 'crypto' | 'forex') => {
    if (type === 'forex') {
      return (change >= 0 ? '+' : '') + change.toFixed(4);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      signDisplay: 'always',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(change);
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
            <TableHead className='text-right'>Volume</TableHead>
            <TableHead className='text-right'>Extra Info</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {markets.map((market) => {
            const isPositive = market.changePercent24h >= 0;
            const changeColor = isPositive ? 'text-green-600' : 'text-red-600';

            const targetSymbol = toTradingViewSymbol(market);
            return (
              <TableRow
                key={market.id}
                className='hover:bg-muted/50 cursor-pointer'
                onClick={() =>
                  router.push(
                    `/dashboard/trading-view?symbol=${encodeURIComponent(targetSymbol)}`
                  )
                }
              >
                <TableCell>
                  <div className='flex items-center space-x-3'>
                    {market.type === 'crypto' && (
                      <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100'>
                        <span className='text-xs font-bold text-gray-600'>
                          {market.symbol.slice(0, 2)}
                        </span>
                      </div>
                    )}
                    <div className='min-w-0'>
                      <div className='text-sm font-semibold'>
                        {market.symbol}
                      </div>
                      <div className='text-muted-foreground truncate text-xs'>
                        {market.name}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={market.type === 'crypto' ? 'default' : 'secondary'}
                    className='text-xs'
                  >
                    {market.type === 'crypto' ? 'CRYPTO' : 'FOREX'}
                  </Badge>
                </TableCell>
                <TableCell className='text-right font-mono'>
                  {formatPrice(market.price, market.type)}
                </TableCell>
                <TableCell className={cn('text-right font-mono', changeColor)}>
                  {formatChange(market.change24h, market.type)}
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
                      {market.changePercent24h.toFixed(2)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className='text-right font-mono text-sm'>
                  {formatVolume(market.volume24h)}
                </TableCell>
                <TableCell className='text-right'>
                  {market.type === 'forex' ? (
                    <div className='space-y-1 text-xs'>
                      <div>Spread: {market.spread.toFixed(4)}</div>
                      <div className='text-muted-foreground'>
                        B: {market.bid.toFixed(4)} | A: {market.ask.toFixed(4)}
                      </div>
                    </div>
                  ) : (
                    <div className='space-y-1 text-xs'>
                      <div>Rank: #{market.rank}</div>
                      <div className='text-muted-foreground'>
                        {market.marketCap
                          ? formatVolume(market.marketCap)
                          : 'N/A'}
                      </div>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

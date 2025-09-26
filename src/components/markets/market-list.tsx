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
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toTradingViewSymbol } from '@/lib/market-symbol';

interface MarketListProps {
  markets: Market[];
}

export function MarketList({ markets }: MarketListProps) {
  const router = useRouter();
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
            const isPositive = market.lastChange >= 0;
            const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
            const isCrypto = market.type.toLowerCase() === 'crypto';

            // Create a temporary market object for toTradingViewSymbol
            const tempMarket = {
              symbol: market.symbol,
              type: market.type.toLowerCase() as 'forex' | 'crypto'
            };
            const targetSymbol = toTradingViewSymbol(tempMarket);

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
                    {isCrypto && (
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
                    variant={isCrypto ? 'default' : 'secondary'}
                    className='text-xs'
                  >
                    {isCrypto ? 'CRYPTO' : 'FOREX'}
                  </Badge>
                </TableCell>
                <TableCell className='text-right font-mono'>
                  {formatNumber(market.lastPrice)}
                </TableCell>
                <TableCell className={cn('text-right font-mono', changeColor)}>
                  {formatChange(market.lastChange)}
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
                      {formatNumber(market.lastChange * 100)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className='text-right font-mono'>
                  {formatNumber(market.lastPrice - market.spread / 2)}
                </TableCell>
                <TableCell className='text-right font-mono'>
                  {formatNumber(market.lastPrice + market.spread / 2)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

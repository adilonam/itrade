'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
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
import { IconCoins, IconTrendingDown } from '@tabler/icons-react';
import { useMarketsWebSocket } from '@/contexts/markets-websocket-context';
import { calculatePnLClient } from '@/lib/calculator-client';
import type { Position, Market, User } from '@prisma/client';

// Extended position type with relations
type PositionWithRelations = Position & {
  user: User | null;
  market: Market | null;
};

interface PortfolioSummaryProps {
  positions: PositionWithRelations[];
  financialMetrics: {
    userBalance: number;
    usedMargin: number;
    equity: number;
    freeMargin: number;
  };
  onClosePosition: (positionId: string) => void;
}

export function PortfolioSummary({
  positions,
  financialMetrics,
  onClosePosition
}: PortfolioSummaryProps) {
  const [realTimePnL, setRealTimePnL] = useState<Record<string, number>>({});
  const { realTimePrices, isConnected, subscribe } = useMarketsWebSocket();

  const placedPositions = useMemo(
    () => positions.filter((position) => position.status === 'PLACED'),
    [positions]
  );

  // Memoize market symbols to prevent unnecessary re-subscriptions
  const marketSymbols = useMemo(() => {
    return placedPositions
      .map((p) => p.market?.symbol)
      .filter((symbol): symbol is string => Boolean(symbol))
      .filter((symbol, index, array) => array.indexOf(symbol) === index);
  }, [placedPositions]);

  // Subscribe to market data for real-time PnL updates
  useEffect(() => {
    if (isConnected && marketSymbols.length > 0) {
      subscribe(marketSymbols);
    }
  }, [isConnected, marketSymbols, subscribe]);

  // Update real-time PnL when market data changes
  useEffect(() => {
    const updates: Record<string, number> = {};
    let hasUpdates = false;

    placedPositions.forEach((position) => {
      if (position.market?.symbol) {
        const realTimeData = realTimePrices.get(position.market.symbol);
        if (realTimeData) {
          const dynamicPnL = position.market
            ? calculatePnLClient(position as any, realTimeData)
            : null;
          if (dynamicPnL !== null) {
            updates[position.id] = dynamicPnL;
            hasUpdates = true;
          }
        }
      }
    });

    if (hasUpdates) {
      setRealTimePnL((prev) => ({ ...prev, ...updates }));
    }
  }, [placedPositions, realTimePrices]);

  // Calculate stock balance (balance - used margin)
  const stockBalance =
    financialMetrics.userBalance - financialMetrics.usedMargin;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Summary</CardTitle>
        <CardDescription>
          Your stock portfolio balance and positions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {/* Stock Balance */}
          <div className='bg-muted/50 flex items-center justify-between rounded-lg p-4'>
            <div className='flex items-center gap-3'>
              <IconCoins className='h-5 w-5 text-blue-600' />
              <div>
                <p className='font-medium'>Stock Balance</p>
                <p className='text-muted-foreground text-sm'>
                  Available for stock trading
                </p>
              </div>
            </div>
            <div className='text-right'>
              <p className='text-2xl font-bold'>${stockBalance.toFixed(2)}</p>
              <p className='text-muted-foreground text-sm'>
                Balance: ${financialMetrics.userBalance.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Assets List */}
          <div className='space-y-2'>
            {placedPositions.length === 0 ? (
              <div className='text-muted-foreground py-8 text-center'>
                <p>No assets found</p>
                <p className='text-sm'>Your assets will appear here</p>
              </div>
            ) : (
              <div className='space-y-2'>
                {placedPositions.map((position) => {
                  const symbol =
                    position.market?.symbol?.split('/')[0] ||
                    position.market?.symbol ||
                    'Unknown';
                  // Use real-time PnL if available, otherwise use stored PnL
                  const pnl =
                    realTimePnL[position.id] !== undefined
                      ? realTimePnL[position.id]
                      : position.pnl || 0;

                  return (
                    <div
                      key={position.id}
                      className='hover:bg-muted/30 flex items-center justify-between rounded-lg border p-3 transition-colors'
                    >
                      <div className='flex items-center gap-3'>
                        <div>
                          <p className='font-medium'>{symbol}</p>
                          <p className='text-muted-foreground text-sm'>
                            {position.quantity?.toFixed(4)} shares
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center gap-3'>
                        <div className='text-right'>
                          <p
                            className={`font-medium ${
                              pnl >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                          </p>
                          <p className='text-muted-foreground text-sm'>
                            {position.status}
                          </p>
                        </div>
                        {/* Sell Button with Confirmation */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant='outline'
                              size='sm'
                              className='h-8 border-red-200 bg-red-50 px-3 text-xs text-red-700 hover:border-red-300 hover:bg-red-100'
                            >
                              <IconTrendingDown className='mr-1 h-3 w-3' />
                              Sell
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Sell Position</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to sell your{' '}
                                {position.type} position in {symbol}?
                                <br />
                                <br />
                                <strong>Position Details:</strong>
                                <br />• Quantity:{' '}
                                {position.quantity?.toFixed(4)} shares
                                <br />• Current P&L: {pnl >= 0 ? '+' : ''}$
                                {pnl.toFixed(2)}
                                <br />
                                <br />
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onClosePosition(position.id)}
                                className='bg-red-600 hover:bg-red-700'
                              >
                                Sell Position
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

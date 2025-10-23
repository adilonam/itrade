'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  IconCoins,
  IconTrendingDown,
  IconChevronDown,
  IconChevronRight
} from '@tabler/icons-react';
import { calculatePnLClient } from '@/lib/calculator-client';
import type { Position, Market, User } from '@prisma/client';

// Extended position type with relations
type PositionWithRelations = Position & {
  user: User | null;
  market: Market | null;
};

interface PortfolioSummaryProps {
  positions: PositionWithRelations[];
  financialData: {
    balance: number;
    usedMargin: number;
    equity: number;
    freeMargin: number;
    marginLevel: number | null;
    totalPnL: number;
    leverage: number;
  };
  realTimePrices: Map<string, any>;
  onClosePosition: (positionId: string, amount?: number) => void;
}

export function PortfolioSummary({
  positions,
  financialData,
  realTimePrices,
  onClosePosition
}: PortfolioSummaryProps) {
  const [realTimePnL, setRealTimePnL] = useState<Record<string, number>>({});
  const [sellAmounts, setSellAmounts] = useState<Record<string, string>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const placedPositions = useMemo(
    () => positions.filter((position) => position.status === 'PLACED'),
    [positions]
  );

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

  // Group positions by market symbol
  const groupedPositions = useMemo(() => {
    const groups: Record<
      string,
      {
        symbol: string;
        marketName: string;
        positions: PositionWithRelations[];
        totalQuantity: number;
        totalValue: number;
        totalPnL: number;
      }
    > = {};

    placedPositions.forEach((position) => {
      const marketSymbol = position.market?.symbol || 'Unknown';
      const marketName = position.market?.name || 'Unknown';

      if (!groups[marketSymbol]) {
        groups[marketSymbol] = {
          symbol: marketSymbol,
          marketName,
          positions: [],
          totalQuantity: 0,
          totalValue: 0,
          totalPnL: 0
        };
      }

      const quantity = Number(position.quantity) || 0;
      const realTimeData = realTimePrices.get(marketSymbol);
      const currentPrice =
        realTimeData?.price ||
        position.market?.lastPrice ||
        position.executedPrice ||
        0;
      const value = quantity * currentPrice;
      const pnl =
        realTimePnL[position.id] !== undefined
          ? realTimePnL[position.id]
          : position.pnl || 0;

      groups[marketSymbol].positions.push(position);
      groups[marketSymbol].totalQuantity += quantity;
      groups[marketSymbol].totalValue += value;
      groups[marketSymbol].totalPnL += pnl;
    });

    return Object.values(groups);
  }, [placedPositions, realTimePrices, realTimePnL]);

  const toggleGroup = (symbol: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(symbol)) {
        newSet.delete(symbol);
      } else {
        newSet.add(symbol);
      }
      return newSet;
    });
  };

  // Calculate stock balance (equity - used margin = free margin)
  const stockBalance = financialData.equity - financialData.usedMargin;

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
            </div>
          </div>

          {/* Assets List */}
          <div className='space-y-2'>
            {groupedPositions.length === 0 ? (
              <div className='text-muted-foreground py-8 text-center'>
                <p>No assets found</p>
                <p className='text-sm'>Your assets will appear here</p>
              </div>
            ) : (
              <div className='space-y-3'>
                {groupedPositions.map((group) => {
                  const isExpanded = expandedGroups.has(group.symbol);
                  const displaySymbol =
                    group.symbol.split('/')[0] || group.symbol;

                  return (
                    <div key={group.symbol} className='space-y-1'>
                      {/* Group Header */}
                      <div
                        className='hover:bg-muted/50 cursor-pointer rounded-lg border border-blue-200 bg-blue-50/50 p-3 transition-colors dark:border-blue-800 dark:bg-blue-950/30'
                        onClick={() => toggleGroup(group.symbol)}
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-3'>
                            {isExpanded ? (
                              <IconChevronDown className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                            ) : (
                              <IconChevronRight className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                            )}
                            <div>
                              <p className='font-semibold text-blue-900 dark:text-blue-100'>
                                {displaySymbol}
                              </p>
                              <p className='text-muted-foreground text-xs'>
                                {group.positions.length} position
                                {group.positions.length > 1 ? 's' : ''} •{' '}
                                {group.totalQuantity.toFixed(4)} shares
                              </p>
                            </div>
                          </div>
                          <div className='flex items-center gap-4'>
                            <div className='text-right'>
                              <p className='text-sm font-medium text-blue-900 dark:text-blue-100'>
                                ${group.totalValue.toFixed(2)}
                              </p>
                              <p
                                className={`text-xs font-medium ${
                                  group.totalPnL >= 0
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                                }`}
                              >
                                {group.totalPnL >= 0 ? '+' : ''}$
                                {group.totalPnL.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Individual Positions (Expanded) */}
                      {isExpanded && (
                        <div className='ml-6 space-y-1'>
                          {group.positions.map((position) => {
                            const pnl =
                              realTimePnL[position.id] !== undefined
                                ? realTimePnL[position.id]
                                : position.pnl || 0;
                            const realTimeData = realTimePrices.get(
                              group.symbol
                            );
                            const currentPrice =
                              realTimeData?.price ||
                              position.market?.lastPrice ||
                              position.executedPrice ||
                              0;
                            const positionValue =
                              (Number(position.quantity) || 0) * currentPrice;

                            return (
                              <div
                                key={position.id}
                                className='hover:bg-muted/30 flex items-center justify-between rounded-lg border p-3 transition-colors'
                              >
                                <div className='flex items-center gap-3'>
                                  <div>
                                    <p className='dark:text-foreground text-sm font-medium'>
                                      Position #{position.id.slice(-8)}
                                    </p>
                                    <p className='text-muted-foreground text-xs'>
                                      {position.quantity?.toFixed(4)} shares • $
                                      {positionValue.toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                                <div className='flex items-center gap-3'>
                                  <div className='text-right'>
                                    <p
                                      className={`text-sm font-medium ${
                                        pnl >= 0
                                          ? 'text-green-600 dark:text-green-400'
                                          : 'text-red-600 dark:text-red-400'
                                      }`}
                                    >
                                      {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                                    </p>
                                    <p className='text-muted-foreground text-xs'>
                                      {position.status}
                                    </p>
                                  </div>
                                  {/* Sell Button with Confirmation */}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant='outline'
                                        size='sm'
                                        className='h-8 border-red-200 bg-red-50 px-3 text-xs text-red-700 hover:border-red-300 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400 dark:hover:border-red-800 dark:hover:bg-red-950/50'
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          // Initialize with full quantity
                                          setSellAmounts((prev) => ({
                                            ...prev,
                                            [position.id]:
                                              position.quantity?.toString() ||
                                              ''
                                          }));
                                        }}
                                      >
                                        <IconTrendingDown className='mr-1 h-3 w-3' />
                                        Sell
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Sell Position
                                        </AlertDialogTitle>
                                        <AlertDialogDescription asChild>
                                          <div className='space-y-4'>
                                            <div>
                                              Are you sure you want to sell your{' '}
                                              {position.type} position in{' '}
                                              {displaySymbol}?
                                            </div>
                                            <div>
                                              <strong>Position Details:</strong>
                                              <br />• Total Quantity:{' '}
                                              {position.quantity?.toFixed(
                                                4
                                              )}{' '}
                                              shares
                                              <br />• Current Value: $
                                              {positionValue.toFixed(2)}
                                              <br />• Current P&L:{' '}
                                              {pnl >= 0 ? '+' : ''}$
                                              {pnl.toFixed(2)}
                                            </div>
                                            <div className='space-y-2'>
                                              <Label
                                                htmlFor={`sell-amount-${position.id}`}
                                              >
                                                Amount to Sell (shares)
                                              </Label>
                                              <Input
                                                id={`sell-amount-${position.id}`}
                                                type='number'
                                                min='0.0001'
                                                max={position.quantity || 0}
                                                step='0.0001'
                                                value={
                                                  sellAmounts[position.id] ||
                                                  position.quantity?.toString() ||
                                                  ''
                                                }
                                                onChange={(e) => {
                                                  setSellAmounts((prev) => ({
                                                    ...prev,
                                                    [position.id]:
                                                      e.target.value
                                                  }));
                                                }}
                                                placeholder={`Max: ${position.quantity?.toFixed(4)}`}
                                              />
                                              <p className='text-muted-foreground text-xs'>
                                                Enter the amount you want to
                                                sell. Leave as is to sell all
                                                shares.
                                              </p>
                                            </div>
                                            <p className='text-destructive text-sm font-medium'>
                                              This action cannot be undone.
                                            </p>
                                          </div>
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => {
                                            const amount = parseFloat(
                                              sellAmounts[position.id] ||
                                                position.quantity?.toString() ||
                                                '0'
                                            );
                                            onClosePosition(
                                              position.id,
                                              amount
                                            );
                                          }}
                                          className='bg-red-600 hover:bg-red-700'
                                          disabled={
                                            !sellAmounts[position.id] ||
                                            parseFloat(
                                              sellAmounts[position.id]
                                            ) <= 0 ||
                                            parseFloat(
                                              sellAmounts[position.id]
                                            ) > (position.quantity || 0)
                                          }
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

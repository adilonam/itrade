'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconLoader2
} from '@tabler/icons-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface PortfolioStock {
  marketId: string;
  symbol: string;
  name: string;
  type: string;
  totalQuantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  totalCost: number;
  currentValue: number;
  totalPnL: number;
  pnlPercentage: number;
  positionCount: number;
}

interface StockPortfolioTableProps {
  portfolio: PortfolioStock[];
  onSellComplete?: () => void;
}

export function StockPortfolioTable({
  portfolio,
  onSellComplete
}: StockPortfolioTableProps) {
  const [sellingStockId, setSellingStockId] = useState<string | null>(null);
  const [stockToSell, setStockToSell] = useState<PortfolioStock | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleSellClick = (stock: PortfolioStock) => {
    setStockToSell(stock);
    setShowConfirmDialog(true);
  };

  const handleConfirmSell = async () => {
    if (!stockToSell) return;

    setSellingStockId(stockToSell.marketId);
    setShowConfirmDialog(false);

    try {
      const response = await fetch('/api/user/portfolio/stock/sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          marketId: stockToSell.marketId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sell positions');
      }

      const result = await response.json();

      toast.success(
        `Successfully sold ${result.totalQuantity} ${stockToSell.symbol}`,
        {
          description: `P&L: ${result.totalPnL >= 0 ? '+' : ''}${result.totalPnL.toFixed(2)} | New Balance: ${result.newBalance.toFixed(2)}`
        }
      );

      // Call the callback to refresh portfolio
      if (onSellComplete) {
        onSellComplete();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to sell positions'
      );
    } finally {
      setSellingStockId(null);
      setStockToSell(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (portfolio.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-12 text-center'>
        <p className='text-muted-foreground text-lg'>
          You don&apos;t have any stocks in your portfolio yet.
        </p>
        <p className='text-muted-foreground mt-2 text-sm'>
          Start trading to build your portfolio.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Stock</TableHead>
              <TableHead className='text-right'>Quantity</TableHead>
              <TableHead className='text-right'>Current Price</TableHead>
              <TableHead className='text-right'>Current Value</TableHead>
              <TableHead className='text-right'>P&L</TableHead>
              <TableHead className='text-right'>Positions</TableHead>
              <TableHead className='text-right'>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {portfolio.map((stock) => {
              const isProfitable = stock.totalPnL >= 0;
              const isSelling = sellingStockId === stock.marketId;

              return (
                <TableRow key={stock.marketId}>
                  <TableCell>
                    <div className='flex flex-col'>
                      <span className='font-semibold'>{stock.symbol}</span>
                      <span className='text-muted-foreground text-xs'>
                        {stock.name}
                      </span>
                      <Badge variant='outline' className='mt-1 w-fit text-xs'>
                        {stock.type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className='text-right font-medium'>
                    {stock.totalQuantity.toFixed(2)}
                  </TableCell>
                  <TableCell className='text-right font-medium'>
                    {formatCurrency(stock.currentPrice)}
                  </TableCell>
                  <TableCell className='text-right font-semibold'>
                    {formatCurrency(stock.currentValue)}
                  </TableCell>
                  <TableCell className='text-right'>
                    <div
                      className={`flex items-center justify-end gap-1 font-semibold ${
                        isProfitable ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {isProfitable ? (
                        <IconTrendingUp className='h-4 w-4' />
                      ) : (
                        <IconTrendingDown className='h-4 w-4' />
                      )}
                      <span>
                        {isProfitable ? '+' : ''}
                        {formatCurrency(stock.totalPnL)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className='text-right'>
                    <Badge variant='secondary'>{stock.positionCount}</Badge>
                  </TableCell>
                  <TableCell className='text-right'>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => handleSellClick(stock)}
                      disabled={isSelling}
                    >
                      {isSelling ? (
                        <>
                          <IconLoader2 className='mr-1 h-3 w-3 animate-spin' />
                          Selling...
                        </>
                      ) : (
                        'Sell All'
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Sale</AlertDialogTitle>
            <AlertDialogDescription>
              {stockToSell && (
                <div className='space-y-2 py-4'>
                  <p>
                    Are you sure you want to sell all{' '}
                    <span className='font-semibold'>{stockToSell.symbol}</span>{' '}
                    positions?
                  </p>
                  <div className='bg-muted rounded-lg p-4 text-sm'>
                    <div className='flex justify-between'>
                      <span>Quantity:</span>
                      <span className='font-semibold'>
                        {stockToSell.totalQuantity.toFixed(2)}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Current Price:</span>
                      <span className='font-semibold'>
                        {formatCurrency(stockToSell.currentPrice)}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Estimated Proceeds:</span>
                      <span className='font-semibold'>
                        {formatCurrency(stockToSell.currentValue)}
                      </span>
                    </div>
                    <div className='border-muted-foreground flex justify-between border-t pt-2'>
                      <span>Estimated P&L:</span>
                      <span
                        className={`font-semibold ${
                          stockToSell.totalPnL >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {stockToSell.totalPnL >= 0 ? '+' : ''}
                        {formatCurrency(stockToSell.totalPnL)} (
                        {formatPercentage(stockToSell.pnlPercentage)})
                      </span>
                    </div>
                  </div>
                  <p className='text-muted-foreground text-xs'>
                    This will close all {stockToSell.positionCount} open
                    position(s) for this stock and update your balance.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSell}>
              Confirm Sale
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

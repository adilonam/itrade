'use client';

import { useState } from 'react';
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
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconLoader2
} from '@tabler/icons-react';
import type { Market } from '@prisma/client';

interface TradingActionsProps {
  market?: Market | null;
}

export function TradingActions({ market: propMarket }: TradingActionsProps) {
  const { data: session } = useSession();
  const [quantity, setQuantity] = useState<string>('');
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [showSellDialog, setShowSellDialog] = useState(false);

  const handleCreateTransaction = async (type: 'BUY' | 'SELL') => {
    if (!session?.user?.id) {
      toast.error('You must be logged in to create transactions');
      return;
    }

    if (!propMarket) {
      toast.error('No market selected');
      return;
    }

    const quantityValue = parseFloat(quantity);

    if (!quantityValue || quantityValue <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setIsCreatingTransaction(true);

    try {
      const response = await fetch('/api/user/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          marketId: propMarket.id,
          quantity: quantityValue,
          description: `${type} ${quantityValue} ${propMarket.symbol}`,
          status: 'PLACED'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create transaction');
      }

      toast.success(`${type} transaction created successfully`);

      // Reset form
      setQuantity('');
      setShowBuyDialog(false);
      setShowSellDialog(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create transaction'
      );
    } finally {
      setIsCreatingTransaction(false);
    }
  };

  if (!propMarket) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trading Actions</CardTitle>
        <CardDescription>
          Create buy or sell transactions for {propMarket.symbol} -{' '}
          {propMarket.name}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <div className='space-y-2'>
            <Label>Market</Label>
            <div className='border-input bg-background ring-offset-background flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm'>
              <span className='text-foreground font-medium'>
                {propMarket.symbol}
              </span>
              <span className='text-muted-foreground text-xs'>
                {propMarket.type}
              </span>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='quantity'>Quantity</Label>
            <Input
              id='quantity'
              type='number'
              placeholder='Enter quantity'
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min='0'
              step='0.0001'
            />
          </div>

          <div className='col-span-2 flex items-end gap-2'>
            <AlertDialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  className='bg-green-600 text-white hover:bg-green-700'
                  disabled={!propMarket || !quantity || isCreatingTransaction}
                >
                  <IconTrendingUp className='mr-2 h-4 w-4' />
                  Buy
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Buy Order</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to create a BUY transaction for{' '}
                    <strong>{quantity}</strong> {propMarket?.symbol}?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleCreateTransaction('BUY')}
                    disabled={isCreatingTransaction}
                    className='bg-green-600 hover:bg-green-700'
                  >
                    {isCreatingTransaction ? (
                      <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
                    ) : null}
                    Confirm Buy
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showSellDialog} onOpenChange={setShowSellDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  variant='destructive'
                  disabled={!propMarket || !quantity || isCreatingTransaction}
                >
                  <IconTrendingDown className='mr-2 h-4 w-4' />
                  Sell
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Sell Order</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to create a SELL transaction for{' '}
                    <strong>{quantity}</strong> {propMarket?.symbol}?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleCreateTransaction('SELL')}
                    disabled={isCreatingTransaction}
                    className='bg-red-600 hover:bg-red-700'
                  >
                    {isCreatingTransaction ? (
                      <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
                    ) : null}
                    Confirm Sell
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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

interface TradingActionsRoomTradingProps {
  market?: Market | null;
}

export function TradingActionsRoomTrading({
  market: propMarket
}: TradingActionsRoomTradingProps) {
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
      toast.error('No market selected for trading');
      return;
    }

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setIsCreatingTransaction(true);

    try {
      const response = await fetch('/api/transactions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          marketId: propMarket.id,
          quantity: quantityNum,
          description: `${type} ${quantityNum} units of ${propMarket.symbol}`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create transaction');
      }

      const result = await response.json();
      toast.success(
        `Transaction ${type.toLowerCase()} order placed successfully!`
      );

      // Reset form
      setQuantity('');
      setShowBuyDialog(false);
      setShowSellDialog(false);
    } catch (error) {
      console.error('Transaction creation error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to create transaction. Please try again.'
      );
    } finally {
      setIsCreatingTransaction(false);
    }
  };

  if (!propMarket) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select a Market</CardTitle>
          <CardDescription>
            Choose a market from the list above to start trading
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          Trade {propMarket.symbol}
          <span className='text-muted-foreground text-sm font-normal'>
            {propMarket.name}
          </span>
        </CardTitle>
        <CardDescription>
          Current Price: ${propMarket.lastPrice.toFixed(5)} | Spread:{' '}
          {propMarket.spread}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='quantity'>Quantity</Label>
          <Input
            id='quantity'
            type='number'
            placeholder='Enter quantity'
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min='0'
            step='0.01'
          />
        </div>

        <div className='flex gap-2'>
          <AlertDialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
            <AlertDialogTrigger asChild>
              <Button
                className='flex-1'
                variant='default'
                disabled={isCreatingTransaction || !quantity}
              >
                {isCreatingTransaction ? (
                  <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <IconTrendingUp className='mr-2 h-4 w-4' />
                )}
                Buy
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Buy Order</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to buy {quantity} units of{' '}
                  {propMarket.symbol} at ${propMarket.lastPrice.toFixed(5)}?
                  <br />
                  <strong>
                    Total: $
                    {(parseFloat(quantity) * propMarket.lastPrice).toFixed(2)}
                  </strong>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleCreateTransaction('BUY')}
                  disabled={isCreatingTransaction}
                >
                  Confirm Buy
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={showSellDialog} onOpenChange={setShowSellDialog}>
            <AlertDialogTrigger asChild>
              <Button
                className='flex-1'
                variant='destructive'
                disabled={isCreatingTransaction || !quantity}
              >
                {isCreatingTransaction ? (
                  <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <IconTrendingDown className='mr-2 h-4 w-4' />
                )}
                Sell
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Sell Order</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to sell {quantity} units of{' '}
                  {propMarket.symbol} at ${propMarket.lastPrice.toFixed(5)}?
                  <br />
                  <strong>
                    Total: $
                    {(parseFloat(quantity) * propMarket.lastPrice).toFixed(2)}
                  </strong>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleCreateTransaction('SELL')}
                  disabled={isCreatingTransaction}
                >
                  Confirm Sell
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

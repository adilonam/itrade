'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
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
import { IconTrendingUp, IconLoader2 } from '@tabler/icons-react';
import type { Market } from '@prisma/client';

interface TradingActionsStockProps {
  market?: Market | null;
}

export function TradingActionsStock({
  market: propMarket
}: TradingActionsStockProps) {
  const { data: session } = useSession();
  const [quantity, setQuantity] = useState<string>('');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [isCreatingPosition, setIsCreatingPosition] = useState(false);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  // Get user balance from session (no need to fetch separately)
  const userBalance = session?.user?.balance ?? 0;

  const handleCreatePosition = async (type: 'BUY') => {
    if (!session?.user?.id) {
      toast.error('You must be logged in to create positions');
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

    // Validate limit price for limit orders
    if (orderType === 'LIMIT') {
      const limitPriceNum = parseFloat(limitPrice);
      if (isNaN(limitPriceNum) || limitPriceNum <= 0) {
        toast.error('Please enter a valid limit price');
        return;
      }
    }

    setIsCreatingPosition(true);

    try {
      const response = await fetch('/api/user/positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          status: orderType === 'LIMIT' ? 'PENDING' : 'PLACED',
          room: 'STOCK',
          executedPrice:
            orderType === 'LIMIT' ? parseFloat(limitPrice) : undefined,
          marketId: propMarket.id,
          quantity: quantityNum,
          description: `${type} ${quantityNum} units of ${propMarket.symbol} (${orderType} order)`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle insufficient balance error
        if (errorData.error === 'Insufficient balance') {
          toast.error(
            errorData.message ||
              `Insufficient balance. You need $${errorData.requiredBalance?.toFixed(2)} but only have $${errorData.currentBalance?.toFixed(2)}.`
          );
        } else {
          throw new Error(errorData.message || 'Failed to create position');
        }
        return;
      }

      await response.json();
      toast.success(`${type} ${orderType} order placed successfully!`);

      // Note: Balance will be updated in the session on next page refresh or login
      // For real-time updates, you might want to implement a balance refresh mechanism

      // Reset form
      setQuantity('');
      setLimitPrice('');
      setShowBuyDialog(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to create position. Please try again.'
      );
    } finally {
      setIsCreatingPosition(false);
    }
  };

  if (!propMarket) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select a Stock</CardTitle>
          <CardDescription>
            Choose a stock from the list above to start trading
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
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
          </div>
          {userBalance !== null && (
            <div className='text-right'>
              <div className='text-muted-foreground text-xs'>Balance</div>
              <div className='text-lg font-semibold'>
                ${userBalance.toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Order Type Selection */}
        <div className='space-y-2'>
          <Label htmlFor='order-type'>Order Type</Label>
          <Select
            value={orderType}
            onValueChange={(value: 'MARKET' | 'LIMIT') => setOrderType(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='MARKET'>Market Order</SelectItem>
              <SelectItem value='LIMIT'>Limit Order</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quantity Input */}
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

        {/* Limit Price Input - Only show for limit orders */}
        {orderType === 'LIMIT' && (
          <div className='space-y-2'>
            <Label htmlFor='limit-price'>Limit Price</Label>
            <Input
              id='limit-price'
              type='number'
              placeholder='Enter limit price'
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              min='0'
              step='0.01'
            />
          </div>
        )}

        {/* Order Summary */}
        {quantity && propMarket && (
          <div className='bg-muted rounded-lg p-3 text-sm'>
            <div className='font-medium'>Order Summary</div>
            <div className='mt-1 space-y-1'>
              <div>Type: {orderType} Order</div>
              <div>Quantity: {quantity} units</div>
              <div>
                Price:{' '}
                {orderType === 'MARKET'
                  ? `Market (${propMarket.lastPrice.toFixed(5)})`
                  : limitPrice}
              </div>
              <div className='font-medium'>
                Total Cost (BUY): $
                {(
                  parseFloat(quantity) *
                  (orderType === 'MARKET'
                    ? propMarket.lastPrice
                    : parseFloat(limitPrice || '0'))
                ).toFixed(2)}
              </div>
              {userBalance !== null && (
                <div className='text-muted-foreground'>
                  Available Balance: ${userBalance.toFixed(2)}
                </div>
              )}
              {userBalance !== null &&
                parseFloat(quantity || '0') *
                  (orderType === 'MARKET'
                    ? propMarket.lastPrice
                    : parseFloat(limitPrice || '0')) >
                  userBalance && (
                  <div className='text-destructive text-xs font-medium'>
                    ⚠ Insufficient balance for BUY order
                  </div>
                )}
            </div>
          </div>
        )}

        <div className='flex gap-2'>
          <AlertDialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
            <AlertDialogTrigger asChild>
              <Button
                className='flex-1'
                variant='default'
                disabled={
                  isCreatingPosition ||
                  !quantity ||
                  (orderType === 'LIMIT' && !limitPrice) ||
                  (userBalance !== null &&
                    parseFloat(quantity || '0') *
                      (orderType === 'MARKET'
                        ? propMarket.lastPrice
                        : parseFloat(limitPrice || '0')) >
                      userBalance)
                }
              >
                {isCreatingPosition ? (
                  <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <IconTrendingUp className='mr-2 h-4 w-4' />
                )}
                Buy {orderType}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Confirm Buy {orderType} Order
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to place a {orderType.toLowerCase()} buy
                  order for {quantity} units of {propMarket.symbol}?
                  <br />
                  {orderType === 'MARKET' ? (
                    <>
                      Price: Market price (${propMarket.lastPrice.toFixed(5)})
                      <br />
                      <strong>
                        Total: $
                        {(parseFloat(quantity) * propMarket.lastPrice).toFixed(
                          2
                        )}
                      </strong>
                    </>
                  ) : (
                    <>
                      Limit Price: ${limitPrice}
                      <br />
                      <strong>
                        Total: $
                        {(
                          parseFloat(quantity) * parseFloat(limitPrice)
                        ).toFixed(2)}
                      </strong>
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleCreatePosition('BUY')}
                  disabled={isCreatingPosition}
                >
                  Confirm Buy
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

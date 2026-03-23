'use client';

import { useState, useEffect } from 'react';
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
import {
  IconTrendingUp,
  IconLoader2,
  IconChartBar,
  IconCash,
  IconSwitchHorizontal
} from '@tabler/icons-react';
import type { Market } from '@/lib/prisma/generated/client';
import {
  calculateRequiredMargin,
  calculateLotSizeFromMargin
} from '@/lib/calculator-client';

interface TradingActionsStockProps {
  market?: Market | null;
}

export function TradingActionsStock({
  market: propMarket
}: TradingActionsStockProps) {
  const { data: session } = useSession();
  const [inputMode, setInputMode] = useState<'LOT' | 'AMOUNT'>('LOT');
  const [inputValue, setInputValue] = useState<string>('');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [isCreatingPosition, setIsCreatingPosition] = useState(false);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [calculatedLotSize, setCalculatedLotSize] = useState<number | null>(
    null
  );
  const [requiredMargin, setRequiredMargin] = useState<number | null>(null);
  // Get user balance from session (no need to fetch separately)
  const userBalance = session?.user?.balance ?? 0;

  // Calculate lot size and margin based on input mode
  useEffect(() => {
    const calculate = async () => {
      if (!inputValue || !propMarket || !session?.user) {
        setCalculatedLotSize(null);
        setRequiredMargin(null);
        return;
      }

      try {
        const inputNum = parseFloat(inputValue);
        if (isNaN(inputNum) || inputNum <= 0) {
          setCalculatedLotSize(null);
          setRequiredMargin(null);
          return;
        }

        const userObj = {
          id: session.user.id,
          balance: session.user.balance || 0,
          leverage: session.user.leverage || 1
        };

        if (inputMode === 'LOT') {
          // User entered lot size directly
          setCalculatedLotSize(inputNum);

          // Calculate required margin from lot size
          const tempPosition = {
            id: 'temp',
            userId: session.user.id,
            type: 'BUY' as const,
            status: 'PLACED' as const,
            room: 'STOCK' as const,
            marketId: propMarket.id,
            quantity: inputNum,
            executedPrice:
              orderType === 'MARKET'
                ? propMarket.lastPrice
                : parseFloat(limitPrice) || propMarket.lastPrice,
            closedPrice: null,
            takeProfit: null,
            stopLoss: null,
            description: null,
            executedAt: new Date(),
            closedAt: null,
            pnl: null,
            user: userObj,
            market: propMarket
          };

          const margin = await calculateRequiredMargin(tempPosition as any);
          setRequiredMargin(margin);
        } else {
          // User entered amount (margin)
          setRequiredMargin(inputNum);

          // Calculate lot size from margin
          const lotSize = calculateLotSizeFromMargin(
            propMarket,
            userObj as any,
            inputNum
          );
          setCalculatedLotSize(lotSize);
        }
      } catch {
        setCalculatedLotSize(null);
        setRequiredMargin(null);
      }
    };

    calculate();
  }, [inputValue, inputMode, propMarket, session?.user, orderType, limitPrice]);

  const handleCreatePosition = async (type: 'BUY') => {
    if (!session?.user?.id) {
      toast.error('You must be logged in to create positions');
      return;
    }

    if (!propMarket) {
      toast.error('No market selected for trading');
      return;
    }

    if (!calculatedLotSize || calculatedLotSize <= 0) {
      toast.error(
        `Please enter a valid ${inputMode === 'LOT' ? 'lot size' : 'amount'}`
      );
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
          balanceType: 'REAL',
          room: 'STOCK',
          executedPrice:
            orderType === 'LIMIT' ? parseFloat(limitPrice) : undefined,
          marketId: propMarket.id,
          quantity: calculatedLotSize, // Always send lot size to API
          description: `${type} ${calculatedLotSize.toFixed(4)} shares of ${propMarket.symbol} (${orderType} order)`
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
      setInputValue('');
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
          </div>
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

        {/* Quantity/Amount Input with Mode Toggle */}
        <div className='space-y-2'>
          <Label htmlFor='input-value'>
            {inputMode === 'LOT' ? 'Quantity (Shares)' : 'Amount ($)'}
          </Label>
          <div className='flex gap-2'>
            <Input
              id='input-value'
              type='number'
              placeholder={
                inputMode === 'LOT'
                  ? 'Enter number of shares'
                  : 'Enter amount in dollars'
              }
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              min='0'
              step='0.01'
              className='flex-1'
            />
            <Button
              type='button'
              variant='outline'
              size='icon'
              onClick={() => {
                setInputMode((prev) => (prev === 'LOT' ? 'AMOUNT' : 'LOT'));
                setInputValue(''); // Clear input when switching modes
              }}
              title={`Current: ${inputMode === 'LOT' ? 'Shares' : 'Amount'}. Click to switch`}
              className='relative shrink-0'
            >
              {inputMode === 'LOT' ? (
                <IconChartBar className='h-4 w-4' />
              ) : (
                <IconCash className='h-4 w-4' />
              )}
              <IconSwitchHorizontal className='absolute right-1 bottom-1 h-2.5 w-2.5 opacity-60' />
            </Button>
          </div>
          {calculatedLotSize !== null && (
            <p className='text-muted-foreground text-xs'>
              {inputMode === 'LOT'
                ? `Total Cost: $${requiredMargin?.toFixed(2) || '0.00'}`
                : `Shares: ${calculatedLotSize.toFixed(4)}`}
            </p>
          )}
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
        {inputValue && propMarket && calculatedLotSize !== null && (
          <div className='bg-muted rounded-lg p-3 text-sm'>
            <div className='font-medium'>Order Summary</div>
            <div className='mt-1 space-y-1'>
              <div>Type: {orderType} Order</div>
              <div>
                Input: {inputMode === 'LOT' ? 'Shares' : 'Amount (Cost)'}
              </div>
              <div>Quantity: {calculatedLotSize.toFixed(4)} shares</div>
              <div>
                Price:{' '}
                {orderType === 'MARKET'
                  ? `Market (${propMarket.lastPrice.toFixed(5)})`
                  : limitPrice}
              </div>
              {requiredMargin !== null && (
                <div className='font-medium'>
                  Total Cost (BUY): ${requiredMargin.toFixed(2)}
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
                  !calculatedLotSize ||
                  (orderType === 'LIMIT' && !limitPrice) ||
                  (userBalance !== null &&
                    requiredMargin !== null &&
                    requiredMargin > userBalance)
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
                  order for {calculatedLotSize?.toFixed(4)} shares of{' '}
                  {propMarket.symbol}?
                  <br />
                  <br />
                  <strong>Quantity:</strong> {calculatedLotSize?.toFixed(4)}{' '}
                  shares
                  <br />
                  {orderType === 'MARKET' ? (
                    <>
                      <strong>Price:</strong> Market price ($
                      {propMarket.lastPrice.toFixed(5)})
                    </>
                  ) : (
                    <>
                      <strong>Limit Price:</strong> ${limitPrice}
                    </>
                  )}
                  <br />
                  {requiredMargin !== null && (
                    <>
                      <strong>Total Cost:</strong> ${requiredMargin.toFixed(2)}
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

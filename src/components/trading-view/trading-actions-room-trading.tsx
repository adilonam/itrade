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
  IconTrendingDown,
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
import type { Room } from '@/lib/prisma/generated/client';

interface TradingActionsRoomTradingProps {
  market?: Market | null;
  room?: Room;
  refreshEventName?: string;
}

export function TradingActionsRoomTrading({
  market: propMarket,
  room = 'TRADING',
  refreshEventName = 'room-trading-positions-refresh'
}: TradingActionsRoomTradingProps) {
  const balanceType = room === 'INSTITUTIONAL' ? 'INSTITUTIONAL' : 'REAL';
  const { data: session } = useSession();
  const [inputMode, setInputMode] = useState<'LOT' | 'AMOUNT'>('LOT');
  const [inputValue, setInputValue] = useState<string>('');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [isCreatingPosition, setIsCreatingPosition] = useState(false);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [calculatedLotSize, setCalculatedLotSize] = useState<number | null>(
    null
  );
  const [requiredMargin, setRequiredMargin] = useState<number | null>(null);

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
            room,
            marketId: propMarket.id,
            quantity: inputNum,
            executedPrice:
              orderType === 'MARKET'
                ? propMarket.lastPrice
                : parseFloat(limitPrice) || propMarket.lastPrice,
            closedPrice: null,
            takeProfit: takeProfit ? parseFloat(takeProfit) : null,
            stopLoss: stopLoss ? parseFloat(stopLoss) : null,
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
  }, [
    inputValue,
    inputMode,
    propMarket,
    room,
    session?.user,
    orderType,
    limitPrice,
    takeProfit,
    stopLoss
  ]);

  const handleCreatePosition = async (type: 'BUY' | 'SELL') => {
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
          balanceType,
          room,
          executedPrice:
            orderType === 'LIMIT' ? parseFloat(limitPrice) : undefined,
          marketId: propMarket.id,
          quantity: calculatedLotSize, // Always send lot size to API
          takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
          stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
          description: `${type} ${calculatedLotSize.toFixed(4)} lots of ${propMarket.symbol} (${orderType} order)`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create position');
      }

      await response.json();
      toast.success(`${type} ${orderType} order placed successfully!`);

      // Notify positions list to refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(refreshEventName));
      }

      // Reset form
      setInputValue('');
      setLimitPrice('');
      setTakeProfit('');
      setStopLoss('');
      setShowBuyDialog(false);
      setShowSellDialog(false);
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
          <CardTitle>Select a Market</CardTitle>
          <CardDescription>
            Choose a market from the list above to start trading
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className='flex h-full min-h-[520px] flex-col'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          Trade {propMarket.symbol}
          <span className='text-muted-foreground text-sm font-normal'>
            {propMarket.name}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className='flex min-h-0 flex-1 flex-col gap-4 overflow-hidden'>
        <div className='min-h-0 flex-1 space-y-4 overflow-y-auto'>
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
              {inputMode === 'LOT' ? 'Lot Size' : 'Amount ($)'}
            </Label>
            <div className='flex gap-2'>
              <Input
                id='input-value'
                type='number'
                placeholder={
                  inputMode === 'LOT'
                    ? 'Enter lot size'
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
                title={`Current: ${inputMode === 'LOT' ? 'Lot Size' : 'Amount'}. Click to switch`}
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
                  ? `Required Margin: $${requiredMargin?.toFixed(2) || '0.00'}`
                  : `Lot Size: ${calculatedLotSize.toFixed(4)} lots`}
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

          {/* Risk Management Section */}
          <div className='space-y-3'>
            <div className='text-muted-foreground text-sm font-medium'>
              Risk Management (Optional)
            </div>

            {/* Take Profit Input */}
            <div className='space-y-2'>
              <Label htmlFor='take-profit'>Take Profit</Label>
              <Input
                id='take-profit'
                type='number'
                placeholder='Enter take profit price'
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                min='0'
                step='0.01'
              />
            </div>

            {/* Stop Loss Input */}
            <div className='space-y-2'>
              <Label htmlFor='stop-loss'>Stop Loss</Label>
              <Input
                id='stop-loss'
                type='number'
                placeholder='Enter stop loss price'
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                min='0'
                step='0.01'
              />
            </div>
          </div>

          {/* Order Summary */}
          {inputValue && propMarket && calculatedLotSize !== null && (
            <div className='bg-muted rounded-lg p-3 text-sm'>
              <div className='font-medium'>Order Summary</div>
              <div className='mt-1 space-y-1'>
                <div>Type: {orderType} Order</div>
                <div>
                  Input: {inputMode === 'LOT' ? 'Lot Size' : 'Amount (Margin)'}
                </div>
                <div>Lot Size: {calculatedLotSize.toFixed(4)} lots</div>
                <div>
                  Price:{' '}
                  {orderType === 'MARKET'
                    ? `Market (${propMarket.lastPrice.toFixed(5)})`
                    : limitPrice}
                </div>
                {takeProfit && <div>Take Profit: ${takeProfit}</div>}
                {stopLoss && <div>Stop Loss: ${stopLoss}</div>}
                {requiredMargin !== null && (
                  <div className='font-medium'>
                    Required Margin: ${requiredMargin.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className='mt-4 flex shrink-0 flex-col gap-2'>
          <AlertDialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
            <AlertDialogTrigger asChild>
              <Button
                className='flex-1'
                variant='default'
                disabled={
                  isCreatingPosition ||
                  !calculatedLotSize ||
                  (orderType === 'LIMIT' && !limitPrice)
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
                  order for {calculatedLotSize?.toFixed(4)} lots of{' '}
                  {propMarket.symbol}?
                  <br />
                  <br />
                  <strong>Lot Size:</strong> {calculatedLotSize?.toFixed(4)}{' '}
                  lots
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
                      <strong>Required Margin:</strong> $
                      {requiredMargin.toFixed(2)}
                      <br />
                    </>
                  )}
                  {takeProfit && (
                    <>
                      <strong>Take Profit:</strong> ${takeProfit}
                      <br />
                    </>
                  )}
                  {stopLoss && (
                    <>
                      <strong>Stop Loss:</strong> ${stopLoss}
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

          <AlertDialog open={showSellDialog} onOpenChange={setShowSellDialog}>
            <AlertDialogTrigger asChild>
              <Button
                className='flex-1'
                variant='destructive'
                disabled={
                  isCreatingPosition ||
                  !calculatedLotSize ||
                  (orderType === 'LIMIT' && !limitPrice)
                }
              >
                {isCreatingPosition ? (
                  <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <IconTrendingDown className='mr-2 h-4 w-4' />
                )}
                Sell {orderType}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Confirm Sell {orderType} Order
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to place a {orderType.toLowerCase()}{' '}
                  sell order for {calculatedLotSize?.toFixed(4)} lots of{' '}
                  {propMarket.symbol}?
                  <br />
                  <br />
                  <strong>Lot Size:</strong> {calculatedLotSize?.toFixed(4)}{' '}
                  lots
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
                      <strong>Required Margin:</strong> $
                      {requiredMargin.toFixed(2)}
                      <br />
                    </>
                  )}
                  {takeProfit && (
                    <>
                      <strong>Take Profit:</strong> ${takeProfit}
                      <br />
                    </>
                  )}
                  {stopLoss && (
                    <>
                      <strong>Stop Loss:</strong> ${stopLoss}
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleCreatePosition('SELL')}
                  disabled={isCreatingPosition}
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

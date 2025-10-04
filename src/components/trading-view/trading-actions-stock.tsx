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
  IconLoader2
} from '@tabler/icons-react';
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
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [userBalance, setUserBalance] = useState<number | null>(null);

  // Fetch user balance
  useEffect(() => {
    async function fetchUserBalance() {
      if (!session?.user?.id) return;

      try {
        const response = await fetch('/api/user/profile');
        if (!response.ok) return;

        const data = await response.json();
        setUserBalance(data.user?.balance ?? 0);
      } catch (error) {
        // Silently handle error
      }
    }

    fetchUserBalance();
  }, [session?.user?.id]);

  // Calculate required margin for SELL orders
  const calculateSellMargin = () => {
    if (!quantity || !propMarket) return 0;

    const qty = parseFloat(quantity);
    const price =
      orderType === 'MARKET'
        ? propMarket.lastPrice
        : parseFloat(limitPrice || '0');

    if (isNaN(qty) || isNaN(price) || price === 0) return 0;

    // If stop loss is set, calculate max potential loss
    if (stopLoss) {
      const stopLossPrice = parseFloat(stopLoss);
      if (!isNaN(stopLossPrice) && stopLossPrice > price) {
        return (stopLossPrice - price) * qty;
      }
    }

    // Without stop loss, require full position value
    return qty * price;
  };

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

    // Validate limit price for limit orders
    if (orderType === 'LIMIT') {
      const limitPriceNum = parseFloat(limitPrice);
      if (isNaN(limitPriceNum) || limitPriceNum <= 0) {
        toast.error('Please enter a valid limit price');
        return;
      }
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
          status: orderType === 'LIMIT' ? 'PROCESSING' : 'PLACED',
          room: 'STOCK',
          executedPrice:
            orderType === 'LIMIT' ? parseFloat(limitPrice) : undefined,
          marketId: propMarket.id,
          quantity: quantityNum,
          takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
          stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
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
          throw new Error(errorData.message || 'Failed to create transaction');
        }
        return;
      }

      await response.json();
      toast.success(`${type} ${orderType} order placed successfully!`);

      // Refresh user balance
      const balanceResponse = await fetch('/api/user/profile');
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setUserBalance(balanceData.user?.balance ?? 0);
      }

      // Reset form
      setQuantity('');
      setLimitPrice('');
      setTakeProfit('');
      setStopLoss('');
      setShowBuyDialog(false);
      setShowSellDialog(false);
    } catch (error) {
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
              {takeProfit && <div>Take Profit: ${takeProfit}</div>}
              {stopLoss && <div>Stop Loss: ${stopLoss}</div>}
              <div className='font-medium'>
                Total Cost (BUY): $
                {(
                  parseFloat(quantity) *
                  (orderType === 'MARKET'
                    ? propMarket.lastPrice
                    : parseFloat(limitPrice || '0'))
                ).toFixed(2)}
              </div>
              <div className='font-medium'>
                Required Margin (SELL): ${calculateSellMargin().toFixed(2)}
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
              {userBalance !== null && calculateSellMargin() > userBalance && (
                <div className='text-destructive text-xs font-medium'>
                  ⚠ Insufficient margin for SELL order
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
                  isCreatingTransaction ||
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
                {isCreatingTransaction ? (
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
                  {takeProfit && (
                    <>
                      <br />
                      Take Profit: ${takeProfit}
                    </>
                  )}
                  {stopLoss && (
                    <>
                      <br />
                      Stop Loss: ${stopLoss}
                    </>
                  )}
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
                disabled={
                  isCreatingTransaction ||
                  !quantity ||
                  (orderType === 'LIMIT' && !limitPrice) ||
                  (userBalance !== null && calculateSellMargin() > userBalance)
                }
              >
                {isCreatingTransaction ? (
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
                  sell order for {quantity} units of {propMarket.symbol}?
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
                  {takeProfit && (
                    <>
                      <br />
                      Take Profit: ${takeProfit}
                    </>
                  )}
                  {stopLoss && (
                    <>
                      <br />
                      Stop Loss: ${stopLoss}
                    </>
                  )}
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

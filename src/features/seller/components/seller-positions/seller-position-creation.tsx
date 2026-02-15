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
import { toast } from 'sonner';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconLoader2,
  IconChartBar,
  IconCash,
  IconSwitchHorizontal,
  IconX
} from '@tabler/icons-react';
import type { Market, User } from '@/lib/prisma/generated/client';
import {
  calculateRequiredMargin,
  calculateLotSizeFromMargin
} from '@/lib/calculator-client';

interface SellerPositionCreationProps {
  initialRoom?: 'TRADING' | 'STOCK';
  onPositionCreated: () => void;
  onCancel: () => void;
}

export function SellerPositionCreation({
  initialRoom = 'TRADING',
  onPositionCreated,
  onCancel
}: SellerPositionCreationProps) {
  const [room, setRoom] = useState<'TRADING' | 'STOCK'>(initialRoom);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingMarkets, setLoadingMarkets] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [marketSymbolFilter, setMarketSymbolFilter] = useState('');
  const [userEmailFilter, setUserEmailFilter] = useState('');
  const [debouncedMarketFilter, setDebouncedMarketFilter] = useState('');
  const [debouncedUserFilter, setDebouncedUserFilter] = useState('');
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

  // Debounce market filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMarketFilter(marketSymbolFilter);
    }, 500);
    return () => clearTimeout(timer);
  }, [marketSymbolFilter]);

  // Debounce user filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserFilter(userEmailFilter);
    }, 500);
    return () => clearTimeout(timer);
  }, [userEmailFilter]);

  // Load markets with lazy filtering
  useEffect(() => {
    const loadMarkets = async () => {
      try {
        setLoadingMarkets(true);
        const params = new URLSearchParams({ room });
        if (debouncedMarketFilter.trim()) {
          // For now, fetch all and filter client-side
          // You could add a search param to the API if needed
        }
        const response = await fetch(`/api/markets?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch markets');
        const data = await response.json();
        let filteredMarkets = data.markets || [];

        // Filter by symbol if filter is provided
        if (debouncedMarketFilter.trim()) {
          const filterLower = debouncedMarketFilter.toLowerCase();
          filteredMarkets = filteredMarkets.filter(
            (m: Market) =>
              m.symbol.toLowerCase().includes(filterLower) ||
              m.name.toLowerCase().includes(filterLower)
          );
        }

        setMarkets(filteredMarkets);
      } catch (error) {
        toast.error('Failed to load markets');
      } finally {
        setLoadingMarkets(false);
      }
    };
    loadMarkets();
  }, [room, debouncedMarketFilter]);

  // Load linked users with lazy filtering
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const params = new URLSearchParams({ limit: '100' });
        if (debouncedUserFilter.trim()) {
          params.set('search', debouncedUserFilter.trim());
        }
        const response = await fetch(`/api/seller/users?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        setUsers(data.users || []);
      } catch (error) {
        toast.error('Failed to load users');
      } finally {
        setLoadingUsers(false);
      }
    };
    loadUsers();
  }, [debouncedUserFilter]);

  // Update selected user when userId changes
  useEffect(() => {
    if (selectedUserId) {
      const user = users.find((u) => u.id === selectedUserId);
      setSelectedUser(user || null);
    } else {
      setSelectedUser(null);
    }
  }, [selectedUserId, users]);

  // Calculate lot size and margin
  useEffect(() => {
    const calculate = async () => {
      if (
        !inputValue ||
        !selectedMarket ||
        !selectedUser ||
        !selectedUser.leverage
      ) {
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
          id: selectedUser.id,
          balance: selectedUser.balance || 0,
          leverage: selectedUser.leverage || 1
        };

        if (inputMode === 'LOT') {
          setCalculatedLotSize(inputNum);
          const tempPosition = {
            id: 'temp',
            userId: selectedUser.id,
            type: 'BUY' as const,
            status: 'PLACED' as const,
            room: room,
            marketId: selectedMarket.id,
            quantity: inputNum,
            executedPrice:
              orderType === 'MARKET'
                ? selectedMarket.lastPrice
                : parseFloat(limitPrice) || selectedMarket.lastPrice,
            closedPrice: null,
            takeProfit: takeProfit ? parseFloat(takeProfit) : null,
            stopLoss: stopLoss ? parseFloat(stopLoss) : null,
            description: null,
            executedAt: new Date(),
            closedAt: null,
            pnl: null,
            user: userObj,
            market: selectedMarket
          };

          const margin = await calculateRequiredMargin(tempPosition as any);
          setRequiredMargin(margin);
        } else {
          setRequiredMargin(inputNum);
          const lotSize = calculateLotSizeFromMargin(
            selectedMarket,
            userObj as any,
            inputNum
          );
          setCalculatedLotSize(lotSize);
        }
      } catch (error) {
        console.error('Error calculating:', error);
        setCalculatedLotSize(null);
        setRequiredMargin(null);
      }
    };

    calculate();
  }, [
    inputValue,
    inputMode,
    selectedMarket,
    selectedUser,
    orderType,
    limitPrice,
    takeProfit,
    stopLoss,
    room
  ]);

  const handleCreatePosition = async (type: 'BUY' | 'SELL') => {
    if (!selectedMarket || !selectedUser) {
      toast.error('Please select a market and user');
      return;
    }

    if (!calculatedLotSize || calculatedLotSize <= 0) {
      toast.error(
        `Please enter a valid ${inputMode === 'LOT' ? 'lot size' : 'amount'}`
      );
      return;
    }

    if (orderType === 'LIMIT') {
      const limitPriceNum = parseFloat(limitPrice);
      if (isNaN(limitPriceNum) || limitPriceNum <= 0) {
        toast.error('Please enter a valid limit price');
        return;
      }
    }

    setIsCreatingPosition(true);

    try {
      const response = await fetch('/api/seller/positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          type,
          status: orderType === 'LIMIT' ? 'PENDING' : 'PLACED',
          room: room,
          executedPrice:
            orderType === 'LIMIT' ? parseFloat(limitPrice) : undefined,
          marketId: selectedMarket.id,
          quantity: calculatedLotSize,
          takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
          stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
          description: `${type} ${calculatedLotSize.toFixed(4)} lots of ${selectedMarket.symbol} for ${selectedUser.name || selectedUser.email} (${orderType} order)`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create position');
      }

      toast.success(`${type} ${orderType} order placed successfully!`);
      setInputValue('');
      setLimitPrice('');
      setTakeProfit('');
      setStopLoss('');
      setShowBuyDialog(false);
      setShowSellDialog(false);
      onPositionCreated();
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

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Create New Position</CardTitle>
            <CardDescription>
              Create a position for a linked user in{' '}
              {room === 'TRADING' ? 'Trading Room' : 'Stock Room'}
            </CardDescription>
          </div>
          <Button variant='ghost' size='sm' onClick={onCancel}>
            <IconX className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Room Selection */}
        <div className='space-y-2'>
          <Label htmlFor='room-select'>Room</Label>
          <Select
            value={room}
            onValueChange={(value: 'TRADING' | 'STOCK') => {
              setRoom(value);
              setSelectedMarket(null); // Reset market when room changes
            }}
          >
            <SelectTrigger id='room-select'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='TRADING'>Trading Room</SelectItem>
              <SelectItem value='STOCK'>Stock Room</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* User Selection with Filter */}
        <div className='space-y-2'>
          <Label htmlFor='user-select'>Select User</Label>
          <div className='flex flex-wrap items-center gap-2'>
            <Input
              id='user-email-filter'
              type='text'
              placeholder='Filter by email...'
              value={userEmailFilter}
              onChange={(e) => setUserEmailFilter(e.target.value)}
              className='h-9 w-48 shrink-0'
            />
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={loadingUsers}
            >
              <SelectTrigger id='user-select' className='min-w-[200px] flex-1'>
                <SelectValue placeholder='Select a user' />
              </SelectTrigger>
              <SelectContent>
                {loadingUsers ? (
                  <SelectItem value='loading' disabled>
                    Loading users...
                  </SelectItem>
                ) : users.length === 0 ? (
                  <SelectItem value='no-users' disabled>
                    No users found
                  </SelectItem>
                ) : (
                  users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email} ({user.email})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          {selectedUser && (
            <p className='text-muted-foreground text-xs'>
              Balance: ${selectedUser.balance.toFixed(2)} | Leverage:{' '}
              {selectedUser.leverage}x
            </p>
          )}
        </div>

        {/* Market Selection with Filter */}
        <div className='space-y-2'>
          <Label htmlFor='market-select'>Select Market</Label>
          <div className='flex flex-wrap items-center gap-2'>
            <Input
              id='market-symbol-filter'
              type='text'
              placeholder='Filter by symbol or name...'
              value={marketSymbolFilter}
              onChange={(e) => setMarketSymbolFilter(e.target.value)}
              className='h-9 w-48 shrink-0'
            />
            <Select
              value={selectedMarket?.id || ''}
              onValueChange={(value) => {
                const market = markets.find((m) => m.id === value);
                setSelectedMarket(market || null);
              }}
              disabled={loadingMarkets}
            >
              <SelectTrigger
                id='market-select'
                className='min-w-[200px] flex-1'
              >
                <SelectValue placeholder='Select a market' />
              </SelectTrigger>
              <SelectContent>
                {loadingMarkets ? (
                  <SelectItem value='loading' disabled>
                    Loading markets...
                  </SelectItem>
                ) : markets.length === 0 ? (
                  <SelectItem value='no-markets' disabled>
                    No markets found
                  </SelectItem>
                ) : (
                  markets.map((market) => (
                    <SelectItem key={market.id} value={market.id}>
                      {market.symbol} - {market.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          {selectedMarket && (
            <p className='text-muted-foreground text-xs'>
              Last Price: ${selectedMarket.lastPrice.toFixed(5)}
            </p>
          )}
        </div>

        {selectedMarket && selectedUser && (
          <>
            {/* Order Type Selection */}
            <div className='space-y-2'>
              <Label htmlFor='order-type'>Order Type</Label>
              <Select
                value={orderType}
                onValueChange={(value: 'MARKET' | 'LIMIT') =>
                  setOrderType(value)
                }
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

            {/* Quantity/Amount Input */}
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
                    setInputValue('');
                  }}
                  title={`Current: ${inputMode === 'LOT' ? 'Lot Size' : 'Amount'}. Click to switch`}
                  className='relative'
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

            {/* Limit Price Input */}
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

            {/* Risk Management */}
            <div className='space-y-3'>
              <div className='text-muted-foreground text-sm font-medium'>
                Risk Management (Optional)
              </div>
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
            {inputValue && selectedMarket && calculatedLotSize !== null && (
              <div className='bg-muted rounded-lg p-3 text-sm'>
                <div className='font-medium'>Order Summary</div>
                <div className='mt-1 space-y-1'>
                  <div>User: {selectedUser.name || selectedUser.email}</div>
                  <div>Type: {orderType} Order</div>
                  <div>
                    Input:{' '}
                    {inputMode === 'LOT' ? 'Lot Size' : 'Amount (Margin)'}
                  </div>
                  <div>Lot Size: {calculatedLotSize.toFixed(4)} lots</div>
                  <div>
                    Price:{' '}
                    {orderType === 'MARKET'
                      ? `Market (${selectedMarket.lastPrice.toFixed(5)})`
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

            {/* Action Buttons */}
            <div className='flex gap-2'>
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
                      Create a {orderType.toLowerCase()} buy order for{' '}
                      {calculatedLotSize?.toFixed(4)} lots of{' '}
                      {selectedMarket.symbol} for user{' '}
                      {selectedUser.name || selectedUser.email}?
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

              <AlertDialog
                open={showSellDialog}
                onOpenChange={setShowSellDialog}
              >
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
                      Create a {orderType.toLowerCase()} sell order for{' '}
                      {calculatedLotSize?.toFixed(4)} lots of{' '}
                      {selectedMarket.symbol} for user{' '}
                      {selectedUser.name || selectedUser.email}?
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
          </>
        )}
      </CardContent>
    </Card>
  );
}

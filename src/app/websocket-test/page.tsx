'use client';

import { useState, useEffect } from 'react';
import { useTwelveDataWebSocket } from '@/hooks/use-twelve-data-websocket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  IconWifi,
  IconWifiOff,
  IconPlayerPlay,
  IconSquare,
  IconPlus,
  IconMinus,
  IconRotate,
  IconHeart,
  IconTrendingUp,
  IconActivity
} from '@tabler/icons-react';

interface PriceDisplayProps {
  symbol: string;
  priceData: any;
}

function PriceDisplay({ symbol, priceData }: PriceDisplayProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: priceData.currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(price);
  };

  const formatVolume = (volume?: number) => {
    if (!volume) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(volume);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString();
  };

  return (
    <Card className='w-full'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='text-lg'>{symbol}</CardTitle>
            <CardDescription className='text-sm'>
              {priceData.exchange} • {priceData.type}
            </CardDescription>
          </div>
          <Badge variant='outline' className='text-xs'>
            {formatTimestamp(priceData.timestamp)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='flex items-center justify-between'>
          <span className='text-muted-foreground text-sm'>Price</span>
          <span className='text-2xl font-bold'>
            {formatPrice(priceData.price)}
          </span>
        </div>

        {priceData.bid && priceData.ask && (
          <div className='grid grid-cols-2 gap-4'>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground text-sm'>Bid</span>
              <span className='font-medium text-green-600'>
                {formatPrice(priceData.bid)}
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground text-sm'>Ask</span>
              <span className='font-medium text-red-600'>
                {formatPrice(priceData.ask)}
              </span>
            </div>
          </div>
        )}

        {priceData.day_volume && (
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground text-sm'>Volume</span>
            <span className='font-medium'>
              {formatVolume(priceData.day_volume)}
            </span>
          </div>
        )}

        {priceData.currency_base && (
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground text-sm'>Base</span>
            <span className='font-medium'>{priceData.currency_base}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function WebSocketTestPage() {
  const [apiKey, setApiKey] = useState('');
  const [symbolInput, setSymbolInput] = useState('');
  const [newSymbol, setNewSymbol] = useState('');

  const {
    isConnected,
    isConnecting,
    error,
    subscribedSymbols,
    priceData,
    subscriptionStatus,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    reset,
    sendHeartbeat
  } = useTwelveDataWebSocket({
    apiKey,
    ownsConnection: true,
    autoConnect: false
  });

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('twelvedata_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Save API key to localStorage when it changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('twelvedata_api_key', apiKey);
    }
  }, [apiKey]);

  const handleConnect = () => {
    if (!apiKey.trim()) {
      alert('Please enter your TwelveData API key');
      return;
    }
    connect();
  };

  const handleSubscribe = () => {
    if (!symbolInput.trim()) {
      alert('Please enter a symbol to subscribe to');
      return;
    }
    subscribe(symbolInput.trim().toUpperCase());
    setSymbolInput('');
  };

  const handleUnsubscribe = (symbol: string) => {
    unsubscribe(symbol);
  };

  const handleAddSymbol = () => {
    if (!newSymbol.trim()) {
      alert('Please enter a symbol');
      return;
    }
    subscribe(newSymbol.trim().toUpperCase());
    setNewSymbol('');
  };

  const connectionStatus = isConnecting
    ? 'Connecting...'
    : isConnected
      ? 'Connected'
      : 'Disconnected';
  const statusColor = isConnecting ? 'yellow' : isConnected ? 'green' : 'red';

  return (
    <div className='container mx-auto space-y-6 p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>TwelveData WebSocket Test</h1>
          <p className='text-muted-foreground'>
            Test real-time price streaming from TwelveData WebSocket API
          </p>
        </div>
        <div className='flex items-center gap-2'>
          {isConnected ? (
            <IconWifi className='h-5 w-5 text-green-500' />
          ) : (
            <IconWifiOff className='h-5 w-5 text-red-500' />
          )}
          <Badge
            variant={
              statusColor === 'green'
                ? 'default'
                : statusColor === 'yellow'
                  ? 'secondary'
                  : 'destructive'
            }
          >
            {connectionStatus}
          </Badge>
        </div>
      </div>

      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue='connection' className='w-full'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='connection'>Connection</TabsTrigger>
          <TabsTrigger value='subscriptions'>Subscriptions</TabsTrigger>
          <TabsTrigger value='data'>Live Data</TabsTrigger>
        </TabsList>

        <TabsContent value='connection' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Connection Settings</CardTitle>
              <CardDescription>
                Configure your TwelveData API key and manage the WebSocket
                connection
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <label htmlFor='api-key' className='text-sm font-medium'>
                  API Key
                </label>
                <Input
                  id='api-key'
                  type='password'
                  placeholder='Enter your TwelveData API key'
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isConnected || isConnecting}
                />
                <p className='text-muted-foreground text-xs'>
                  Your API key is stored locally in your browser
                </p>
              </div>

              <div className='flex gap-2'>
                <Button
                  onClick={handleConnect}
                  disabled={isConnected || isConnecting || !apiKey.trim()}
                  className='flex items-center gap-2'
                >
                  <IconPlayerPlay className='h-4 w-4' />
                  Connect
                </Button>
                <Button
                  onClick={disconnect}
                  disabled={!isConnected}
                  variant='outline'
                  className='flex items-center gap-2'
                >
                  <IconSquare className='h-4 w-4' />
                  Disconnect
                </Button>
                <Button
                  onClick={sendHeartbeat}
                  disabled={!isConnected}
                  variant='outline'
                  className='flex items-center gap-2'
                >
                  <IconHeart className='h-4 w-4' />
                  Heartbeat
                </Button>
                <Button
                  onClick={reset}
                  disabled={!isConnected}
                  variant='outline'
                  className='flex items-center gap-2'
                >
                  <IconRotate className='h-4 w-4' />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='subscriptions' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Symbol Subscriptions</CardTitle>
              <CardDescription>
                Subscribe to real-time price updates for specific symbols
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex gap-2'>
                <Input
                  placeholder='Enter symbol (e.g., AAPL, MSFT, EUR/USD)'
                  value={symbolInput}
                  onChange={(e) => setSymbolInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubscribe()}
                  disabled={!isConnected}
                />
                <Button
                  onClick={handleSubscribe}
                  disabled={!isConnected || !symbolInput.trim()}
                  className='flex items-center gap-2'
                >
                  <IconPlus className='h-4 w-4' />
                  Subscribe
                </Button>
              </div>

              {subscriptionStatus && (
                <div className='space-y-2'>
                  <h4 className='font-medium'>Last Subscription Status</h4>
                  <div className='space-y-1 text-sm'>
                    {subscriptionStatus.success &&
                      subscriptionStatus.success.length > 0 && (
                        <div>
                          <span className='font-medium text-green-600'>
                            Success:
                          </span>
                          <ul className='ml-4 list-disc'>
                            {subscriptionStatus.success.map((item, index) => (
                              <li key={index}>
                                {item.symbol} ({item.exchange}) - {item.type}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    {subscriptionStatus.fails &&
                      subscriptionStatus.fails.length > 0 && (
                        <div>
                          <span className='font-medium text-red-600'>
                            Failed:
                          </span>
                          <ul className='ml-4 list-disc'>
                            {subscriptionStatus.fails.map((item, index) => (
                              <li key={index}>
                                {item.symbol}: {item.message}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                </div>
              )}

              <Separator />

              <div className='space-y-2'>
                <h4 className='font-medium'>
                  Subscribed Symbols ({subscribedSymbols.length})
                </h4>
                {subscribedSymbols.length === 0 ? (
                  <p className='text-muted-foreground text-sm'>
                    No symbols subscribed
                  </p>
                ) : (
                  <div className='flex flex-wrap gap-2'>
                    {subscribedSymbols.map((symbol) => (
                      <Badge
                        key={symbol}
                        variant='secondary'
                        className='flex items-center gap-1'
                      >
                        {symbol}
                        <button
                          onClick={() => handleUnsubscribe(symbol)}
                          className='ml-1 hover:text-red-500'
                        >
                          <IconMinus className='h-3 w-3' />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='data' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <IconActivity className='h-5 w-5' />
                Live Price Data
              </CardTitle>
              <CardDescription>
                Real-time price updates for subscribed symbols
              </CardDescription>
            </CardHeader>
            <CardContent>
              {priceData.size === 0 ? (
                <div className='text-muted-foreground py-8 text-center'>
                  <IconTrendingUp className='mx-auto mb-4 h-12 w-12 opacity-50' />
                  <p>No price data received yet</p>
                  <p className='text-sm'>
                    Subscribe to symbols to see live price updates
                  </p>
                </div>
              ) : (
                <ScrollArea className='h-[600px]'>
                  <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    {Array.from(priceData.entries()).map(([symbol, data]) => (
                      <PriceDisplay
                        key={symbol}
                        symbol={symbol}
                        priceData={data}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common symbols and actions for testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div>
              <h4 className='mb-2 font-medium'>Popular Symbols</h4>
              <div className='flex flex-wrap gap-2'>
                {[
                  'AAPL',
                  'MSFT',
                  'GOOGL',
                  'TSLA',
                  'AMZN',
                  'EUR/USD',
                  'GBP/USD',
                  'BTC/USD',
                  'ETH/USD'
                ].map((symbol) => (
                  <Button
                    key={symbol}
                    variant='outline'
                    size='sm'
                    onClick={() => setNewSymbol(symbol)}
                    disabled={!isConnected}
                  >
                    {symbol}
                  </Button>
                ))}
              </div>
            </div>

            <div className='flex gap-2'>
              <Input
                placeholder='Symbol to add'
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                disabled={!isConnected}
                className='flex-1'
              />
              <Button
                onClick={handleAddSymbol}
                disabled={!isConnected || !newSymbol.trim()}
                className='flex items-center gap-2'
              >
                <IconPlus className='h-4 w-4' />
                Add Symbol
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

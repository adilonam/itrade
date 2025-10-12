'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback
} from 'react';
import { useTwelveDataWebSocket } from '@/hooks/use-twelve-data-websocket';
import type { Market } from '@prisma/client';
import type { TwelveDataWebSocketPriceData } from '@/types/twelvedata';

interface MarketsWebSocketContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;

  // Market data
  markets: Market[];
  realTimePrices: Map<string, TwelveDataWebSocketPriceData>;

  // Actions
  connect: () => void;
  disconnect: () => void;
  updateMarkets: (markets: Market[]) => void;
  refreshPrices: () => void;
  reset: () => void;
  subscribe: (symbols: string[]) => void;
}

const MarketsWebSocketContext =
  createContext<MarketsWebSocketContextType | null>(null);

interface MarketsWebSocketProviderProps {
  children: React.ReactNode;
  initialMarkets?: Market[];
}

export function MarketsWebSocketProvider({
  children,
  initialMarkets = []
}: MarketsWebSocketProviderProps) {
  const [markets, setMarkets] = useState<Market[]>(initialMarkets);
  const apiKey = process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY || '';

  const {
    isConnected,
    isConnecting,
    error,
    priceData: realTimePrices,
    connect: wsConnect,
    disconnect: wsDisconnect,
    subscribe: wsSubscribe,
    unsubscribe: wsUnsubscribe,
    reset: wsReset
  } = useTwelveDataWebSocket({
    apiKey,
    autoConnect: true
  });

  // Subscribe to all market symbols when connected
  useEffect(() => {
    if (isConnected && markets.length > 0) {
      const symbols = markets.map((market) => market.symbol);
      if (symbols.length > 0) {
        wsSubscribe(symbols);
      }
    }
  }, [isConnected, markets, wsSubscribe]);

  const connect = useCallback(() => {
    console.log('Connecting WebSocket from provider ....');
    if (apiKey) {
      wsConnect();
    }
  }, [apiKey, wsConnect]);

  const disconnect = useCallback(() => {
    console.log('Disconnecting WebSocket from provider ....');
    wsDisconnect();
  }, [wsDisconnect]);

  const updateMarkets = useCallback(
    (newMarkets: Market[]) => {
      console.log('Updating markets in provider ....');
      setMarkets(newMarkets);

      // If connected, update subscriptions
      if (isConnected) {
        const currentSymbols = Array.from(realTimePrices.keys());
        const newSymbols = newMarkets.map((m) => m.symbol);

        // Unsubscribe from symbols no longer in markets
        const symbolsToUnsubscribe = currentSymbols.filter(
          (symbol) => !newSymbols.includes(symbol)
        );
        if (symbolsToUnsubscribe.length > 0) {
          wsUnsubscribe(symbolsToUnsubscribe);
        }

        // Subscribe to new symbols
        const symbolsToSubscribe = newSymbols.filter(
          (symbol) => !currentSymbols.includes(symbol)
        );
        if (symbolsToSubscribe.length > 0) {
          wsSubscribe(symbolsToSubscribe);
        }
      }
    },

    [isConnected, realTimePrices, wsSubscribe, wsUnsubscribe]
  );

  const refreshPrices = useCallback(() => {
    console.log('Refreshing prices in provider ....');
    if (isConnected && markets.length > 0) {
      const symbols = markets.map((market) => market.symbol);
      wsSubscribe(symbols);
    }
  }, [isConnected, markets, wsSubscribe]);

  const reset = useCallback(() => {
    console.log('Resetting WebSocket from provider ....');
    wsReset();
  }, [wsReset]);

  const subscribe = useCallback(
    (symbols: string[]) => {
      wsSubscribe(symbols);
    },
    [wsSubscribe]
  );

  const value: MarketsWebSocketContextType = {
    isConnected,
    isConnecting,
    error,
    markets,
    realTimePrices,
    connect,
    disconnect,
    updateMarkets,
    refreshPrices,
    reset,
    subscribe
  };

  return (
    <MarketsWebSocketContext.Provider value={value}>
      {children}
    </MarketsWebSocketContext.Provider>
  );
}

export function useMarketsWebSocket() {
  const context = useContext(MarketsWebSocketContext);
  if (!context) {
    throw new Error(
      'useMarketsWebSocket must be used within a MarketsWebSocketProvider'
    );
  }
  return context;
}

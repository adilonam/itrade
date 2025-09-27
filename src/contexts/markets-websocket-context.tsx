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
    subscribe,
    unsubscribe
  } = useTwelveDataWebSocket({
    apiKey,
    autoConnect: true
  });

  // Subscribe to all market symbols when connected
  useEffect(() => {
    if (isConnected && markets.length > 0) {
      const symbols = markets.map((market) => market.symbol);
      if (symbols.length > 0) {
        subscribe(symbols);
      }
    }
  }, [isConnected, markets, subscribe]);

  const connect = useCallback(() => {
    if (apiKey) {
      wsConnect();
    }
  }, [apiKey, wsConnect]);

  const disconnect = useCallback(() => {
    wsDisconnect();
  }, [wsDisconnect]);

  const updateMarkets = useCallback(
    (newMarkets: Market[]) => {
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
          unsubscribe(symbolsToUnsubscribe);
        }

        // Subscribe to new symbols
        const symbolsToSubscribe = newSymbols.filter(
          (symbol) => !currentSymbols.includes(symbol)
        );
        if (symbolsToSubscribe.length > 0) {
          subscribe(symbolsToSubscribe);
        }
      }
    },
    [isConnected, realTimePrices, subscribe, unsubscribe]
  );

  const refreshPrices = useCallback(() => {
    if (isConnected && markets.length > 0) {
      const symbols = markets.map((market) => market.symbol);
      subscribe(symbols);
    }
  }, [isConnected, markets, subscribe]);

  const value: MarketsWebSocketContextType = {
    isConnected,
    isConnecting,
    error,
    markets,
    realTimePrices,
    connect,
    disconnect,
    updateMarkets,
    refreshPrices
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

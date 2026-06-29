'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  useCallback,
  useSyncExternalStore
} from 'react';
import {
  twelveDataWebSocketManager,
  type TwelveDataWebSocketSnapshot
} from '@/lib/twelve-data-websocket-manager';
import {
  getTwelveDataPublicApiKey,
  TWELVE_DATA_PUBLIC_KEY_ENV
} from '@/lib/twelve-data-config';
import type { Market } from '@/lib/prisma/generated/client';
import type { TwelveDataWebSocketPriceData } from '@/types/twelvedata';

interface MarketsWebSocketContextType {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  markets: Market[];
  realTimePrices: Map<string, TwelveDataWebSocketPriceData>;
  connect: () => void;
  disconnect: () => void;
  updateMarkets: (markets: Market[]) => void;
  refreshPrices: () => void;
  reset: () => void;
  subscribe: (symbols: string[]) => void;
  registerSymbols: (consumerId: string, symbols: string[]) => void;
}

const MarketsWebSocketContext =
  createContext<MarketsWebSocketContextType | null>(null);

interface MarketsWebSocketProviderProps {
  children: React.ReactNode;
  initialMarkets?: Market[];
}

function useTwelveDataWebSocketSnapshot(): TwelveDataWebSocketSnapshot {
  return useSyncExternalStore(
    (listener) => twelveDataWebSocketManager.subscribe(listener),
    () => twelveDataWebSocketManager.getSnapshot(),
    () => twelveDataWebSocketManager.getServerSnapshot()
  );
}

export function MarketsWebSocketProvider({
  children,
  initialMarkets = []
}: MarketsWebSocketProviderProps) {
  const [markets, setMarkets] = useState<Market[]>(initialMarkets);
  const [symbolRegistry, setSymbolRegistry] = useState<
    Map<string, readonly string[]>
  >(() => new Map());
  const apiKey = getTwelveDataPublicApiKey() ?? '';
  const configError = apiKey
    ? null
    : `${TWELVE_DATA_PUBLIC_KEY_ENV} is not set. Live prices are disabled.`;

  useEffect(
    () => twelveDataWebSocketManager.acquire(apiKey, Boolean(apiKey)),
    [apiKey]
  );

  const {
    isConnected,
    isConnecting,
    error: wsError,
    priceData: realTimePrices
  } = useTwelveDataWebSocketSnapshot();

  const error = configError ?? wsError;

  const registerSymbols = useCallback(
    (consumerId: string, symbols: string[]) => {
      setSymbolRegistry((prev) => {
        const next = new Map(prev);
        if (symbols.length === 0) {
          next.delete(consumerId);
        } else {
          next.set(consumerId, symbols);
        }
        return next;
      });
    },
    []
  );

  const desiredSymbols = useMemo(() => {
    const symbols = new Set<string>();
    for (const market of markets) {
      symbols.add(market.symbol);
    }
    for (const consumerSymbols of Array.from(symbolRegistry.values())) {
      for (const symbol of consumerSymbols) {
        symbols.add(symbol);
      }
    }
    return symbols;
  }, [markets, symbolRegistry]);

  useEffect(() => {
    twelveDataWebSocketManager.setDesiredSymbols(desiredSymbols);
  }, [desiredSymbols]);

  const connect = useCallback(() => {
    if (apiKey) {
      twelveDataWebSocketManager.connect();
    }
  }, [apiKey]);

  const disconnect = useCallback(() => {
    twelveDataWebSocketManager.disconnect();
  }, []);

  const updateMarkets = useCallback((newMarkets: Market[]) => {
    setMarkets(newMarkets);
  }, []);

  const refreshPrices = useCallback(() => {
    twelveDataWebSocketManager.setDesiredSymbols(desiredSymbols);
  }, [desiredSymbols]);

  const reset = useCallback(() => {
    twelveDataWebSocketManager.reset();
  }, []);

  const subscribe = useCallback((symbols: string[]) => {
    twelveDataWebSocketManager.subscribeSymbols(symbols);
  }, []);

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
    subscribe,
    registerSymbols
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

/** Register symbol interest for a component; merged into one shared subscription. */
export function useMarketsWebSocketSymbols(symbols: string[]) {
  const { registerSymbols } = useMarketsWebSocket();
  const consumerId = useId();
  const stableSymbols = useMemo(
    () =>
      Array.from(new Set(symbols.filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [symbols]
  );
  const symbolsKey = stableSymbols.join('\0');

  useEffect(() => {
    registerSymbols(consumerId, stableSymbols);
    return () => {
      registerSymbols(consumerId, []);
    };
  }, [consumerId, registerSymbols, symbolsKey, stableSymbols]);
}

'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
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
import {
  getPriceFeedConnectionStatus,
  type PriceFeedConnectionStatus
} from '@/lib/markets-price-feed-status';
import type {
  TwelveDataRestPricePayload,
  TwelveDataWebSocketPriceData
} from '@/types/twelvedata';

const SYMBOL_SUBSCRIPTION_DEBOUNCE_MS = 300;
const FALLBACK_POLL_INTERVAL_MS = 30_000;
const LOG_PREFIX = '[TwelveDataWS]';

interface MarketsWebSocketContextType {
  isConnected: boolean;
  isConnecting: boolean;
  isFallbackMode: boolean;
  restOnlyMode: boolean;
  /** WebSocket connected OR REST actively providing prices. */
  isPriceFeedConnected: boolean;
  priceFeedStatus: PriceFeedConnectionStatus;
  lastRestFetchAt: number | null;
  error: string | null;
  errorLog: string[];
  realTimePrices: Map<string, TwelveDataWebSocketPriceData>;
  subscribedSymbols: string[];
  excludedSymbols: string[];
  desiredSymbols: string[];
  connect: () => void;
  refreshPrices: () => void;
  reset: () => void;
  registerSymbols: (consumerId: string, symbols: string[]) => void;
}

const MarketsWebSocketContext =
  createContext<MarketsWebSocketContextType | null>(null);

interface MarketsWebSocketProviderProps {
  children: React.ReactNode;
}

function useTwelveDataWebSocketSnapshot(): TwelveDataWebSocketSnapshot {
  return useSyncExternalStore(
    (listener) => twelveDataWebSocketManager.subscribe(listener),
    () => twelveDataWebSocketManager.getSnapshot(),
    () => twelveDataWebSocketManager.getServerSnapshot()
  );
}

async function fetchRestPrices(
  symbols: Iterable<string>
): Promise<Record<string, TwelveDataRestPricePayload>> {
  const symbolList = Array.from(symbols);
  if (symbolList.length === 0) return {};

  const query = encodeURIComponent(symbolList.join(','));
  const response = await fetch(`/api/markets/prices?symbols=${query}`, {
    method: 'GET',
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`REST price fetch failed (${response.status})`);
  }

  const data = (await response.json()) as {
    prices?: Record<string, TwelveDataRestPricePayload>;
  };

  return data.prices ?? {};
}

export function MarketsWebSocketProvider({
  children
}: MarketsWebSocketProviderProps) {
  const [symbolRegistry, setSymbolRegistry] = useState<
    Map<string, readonly string[]>
  >(() => new Map());
  const apiKey = getTwelveDataPublicApiKey() ?? '';
  const configError = apiKey
    ? null
    : `${TWELVE_DATA_PUBLIC_KEY_ENV} is not set. Live prices are disabled.`;
  const restFetchInFlight = useRef(false);
  const [lastRestFetchAt, setLastRestFetchAt] = useState<number | null>(null);
  const [restFetchFailed, setRestFetchFailed] = useState(false);
  const [restFreshnessTick, setRestFreshnessTick] = useState(0);

  useEffect(
    () => twelveDataWebSocketManager.acquire(apiKey, Boolean(apiKey)),
    [apiKey]
  );

  const {
    isConnected,
    isConnecting,
    isFallbackMode,
    restOnlyMode,
    error: wsError,
    errorLog: wsErrorLog,
    priceData: realTimePrices,
    subscribedSymbols,
    excludedSymbols
  } = useTwelveDataWebSocketSnapshot();

  const error = configError ?? wsError;
  const errorLog = configError
    ? [configError, ...wsErrorLog.filter((entry) => entry !== configError)]
    : wsErrorLog;

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

  const desiredSymbolsSet = useMemo(() => {
    const symbols = new Set<string>();
    for (const consumerSymbols of Array.from(symbolRegistry.values())) {
      for (const symbol of consumerSymbols) {
        symbols.add(symbol);
      }
    }
    return symbols;
  }, [symbolRegistry]);

  const desiredSymbols = useMemo(
    () =>
      Array.from(desiredSymbolsSet).sort((a, b) => a.localeCompare(b)),
    [desiredSymbolsSet]
  );

  const desiredSymbolsKey = useMemo(
    () => desiredSymbols.join(','),
    [desiredSymbols]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      twelveDataWebSocketManager.setDesiredSymbols(desiredSymbolsSet);
    }, SYMBOL_SUBSCRIPTION_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [desiredSymbolsKey, desiredSymbolsSet]);

  const pullRestPrices = useCallback(
    async (symbols: Iterable<string>, reason: string) => {
      const symbolList = Array.from(symbols);
      if (!apiKey || symbolList.length === 0 || restFetchInFlight.current) {
        return;
      }

      console.log(`${LOG_PREFIX} REST fallback fetch`, {
        reason,
        symbols: symbolList,
        count: symbolList.length
      });

      restFetchInFlight.current = true;
      try {
        const prices = await fetchRestPrices(symbolList);
        console.log(`${LOG_PREFIX} REST fallback fetch ok`, {
          reason,
          symbolCount: Object.keys(prices).length
        });
        twelveDataWebSocketManager.applyRestPrices(prices);
        setLastRestFetchAt(Date.now());
        setRestFetchFailed(false);
      } catch (error) {
        setRestFetchFailed(true);
        console.warn(`${LOG_PREFIX} REST fallback fetch failed`, {
          reason,
          error: error instanceof Error ? error.message : 'unknown error'
        });
      } finally {
        restFetchInFlight.current = false;
      }
    },
    [apiKey]
  );

  const excludedSymbolsSet = useMemo(
    () => new Set(excludedSymbols),
    [excludedSymbols]
  );

  const shouldPollFallbackRest =
    Boolean(apiKey) &&
    desiredSymbolsSet.size > 0 &&
    (restOnlyMode || isFallbackMode || (!isConnected && !isConnecting));

  const shouldPollExcludedRest =
    Boolean(apiKey) && excludedSymbolsSet.size > 0 && !isFallbackMode;

  useEffect(() => {
    if (!shouldPollFallbackRest) return;

    console.log(`${LOG_PREFIX} starting fallback REST polling`, {
      intervalMs: FALLBACK_POLL_INTERVAL_MS,
      symbolCount: desiredSymbolsSet.size,
      isFallbackMode,
      isConnected,
      isConnecting
    });

    void pullRestPrices(desiredSymbolsSet, 'fallback poll (initial)');
    const interval = setInterval(() => {
      void pullRestPrices(desiredSymbolsSet, 'fallback poll (interval)');
    }, FALLBACK_POLL_INTERVAL_MS);

    return () => {
      console.log(`${LOG_PREFIX} stopping fallback REST polling`);
      clearInterval(interval);
    };
  }, [shouldPollFallbackRest, pullRestPrices, desiredSymbolsSet, isFallbackMode, isConnected, isConnecting]);

  useEffect(() => {
    if (!shouldPollExcludedRest) return;

    console.log(`${LOG_PREFIX} starting excluded-symbol REST polling`, {
      intervalMs: FALLBACK_POLL_INTERVAL_MS,
      excludedSymbols
    });

    void pullRestPrices(excludedSymbolsSet, 'excluded poll (initial)');
    const interval = setInterval(() => {
      void pullRestPrices(excludedSymbolsSet, 'excluded poll (interval)');
    }, FALLBACK_POLL_INTERVAL_MS);

    return () => {
      console.log(`${LOG_PREFIX} stopping excluded-symbol REST polling`);
      clearInterval(interval);
    };
  }, [shouldPollExcludedRest, pullRestPrices, excludedSymbolsSet, excludedSymbols]);

  const connect = useCallback(() => {
    if (restOnlyMode) {
      console.log(`${LOG_PREFIX} connect skipped`, { reason: 'REST-only mode locked' });
      return;
    }
    if (apiKey) {
      twelveDataWebSocketManager.connect();
    }
  }, [apiKey, restOnlyMode]);

  const refreshPrices = useCallback(() => {
    if (restOnlyMode || isFallbackMode || !isConnected) {
      void pullRestPrices(desiredSymbolsSet, 'manual refresh (fallback/disconnected)');
      return;
    }
    if (excludedSymbolsSet.size > 0) {
      void pullRestPrices(excludedSymbolsSet, 'manual refresh (excluded)');
    }
    twelveDataWebSocketManager.setDesiredSymbols(desiredSymbolsSet);
  }, [
    desiredSymbolsSet,
    excludedSymbolsSet,
    isConnected,
    isFallbackMode,
    restOnlyMode,
    pullRestPrices
  ]);

  const reset = useCallback(() => {
    twelveDataWebSocketManager.reset();
    setLastRestFetchAt(null);
    setRestFetchFailed(false);
  }, []);

  useEffect(() => {
    if (lastRestFetchAt === null) return;
    const interval = setInterval(() => {
      setRestFreshnessTick((tick) => tick + 1);
    }, FALLBACK_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [lastRestFetchAt]);

  const priceFeedStatus = useMemo(() => {
    void restFreshnessTick;
    return getPriceFeedConnectionStatus({
        hasApiKey: Boolean(apiKey),
        isWsConnected: isConnected,
        isWsConnecting: isConnecting,
        restOnlyMode,
        lastRestFetchAt,
        restFetchFailed,
        hasDesiredSymbols: desiredSymbolsSet.size > 0
    });
  }, [
      apiKey,
      isConnected,
      isConnecting,
      restOnlyMode,
      lastRestFetchAt,
      restFetchFailed,
      desiredSymbolsSet.size,
      restFreshnessTick
    ]
  );

  const isPriceFeedConnected = priceFeedStatus === 'connected';

  const value: MarketsWebSocketContextType = {
    isConnected,
    isConnecting,
    isFallbackMode,
    restOnlyMode,
    isPriceFeedConnected,
    priceFeedStatus,
    lastRestFetchAt,
    error,
    errorLog,
    realTimePrices,
    subscribedSymbols,
    excludedSymbols,
    desiredSymbols,
    connect,
    refreshPrices,
    reset,
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

'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import {
  twelveDataWebSocketManager,
  type TwelveDataWebSocketSnapshot
} from '@/lib/twelve-data-websocket-manager';

interface UseTwelveDataWebSocketOptions {
  apiKey: string;
  /** When true, this hook owns the shared connection (test/dev only). */
  ownsConnection?: boolean;
  autoConnect?: boolean;
  heartbeatInterval?: number;
}

export function useTwelveDataWebSocket({
  apiKey,
  ownsConnection = false,
  autoConnect = false,
  heartbeatInterval = 10000
}: UseTwelveDataWebSocketOptions) {
  useEffect(() => {
    if (!ownsConnection) return;
    return twelveDataWebSocketManager.acquire(apiKey, autoConnect, heartbeatInterval);
  }, [apiKey, autoConnect, heartbeatInterval, ownsConnection]);

  const snapshot = useSyncExternalStore<TwelveDataWebSocketSnapshot>(
    (listener) => twelveDataWebSocketManager.subscribe(listener),
    () => twelveDataWebSocketManager.getSnapshot(),
    () => twelveDataWebSocketManager.getServerSnapshot()
  );

  const connect = useCallback(() => {
    twelveDataWebSocketManager.connect();
  }, []);

  const disconnect = useCallback(() => {
    twelveDataWebSocketManager.disconnect();
  }, []);

  const subscribe = useCallback((symbols: string | string[]) => {
    twelveDataWebSocketManager.subscribeSymbols(symbols);
  }, []);

  const unsubscribe = useCallback((symbols: string | string[]) => {
    twelveDataWebSocketManager.unsubscribeSymbols(symbols);
  }, []);

  const reset = useCallback(() => {
    twelveDataWebSocketManager.reset();
  }, []);

  const sendHeartbeat = useCallback(() => {
    twelveDataWebSocketManager.sendHeartbeat();
  }, []);

  return {
    ...snapshot,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    reset,
    sendHeartbeat
  };
}

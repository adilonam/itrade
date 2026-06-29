'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import {
  twelveDataWebSocketManager,
  type TwelveDataWebSocketSnapshot
} from '@/lib/twelve-data-websocket-manager';

interface UseTwelveDataWebSocketOptions {
  apiKey: string;
  autoConnect?: boolean;
  heartbeatInterval?: number;
}

export function useTwelveDataWebSocket({
  apiKey,
  autoConnect = false,
  heartbeatInterval = 1000
}: UseTwelveDataWebSocketOptions) {
  useEffect(
    () => twelveDataWebSocketManager.acquire(apiKey, autoConnect, heartbeatInterval),
    [apiKey, autoConnect, heartbeatInterval]
  );

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

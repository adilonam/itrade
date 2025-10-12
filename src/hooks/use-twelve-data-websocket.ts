'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type {
  TwelveDataWebSocketResponse,
  TwelveDataWebSocketPriceData,
  TwelveDataWebSocketSubscription,
  TwelveDataWebSocketSubscribeStatus,
  TwelveDataWebSocketError,
  TwelveDataWebSocketResetStatus
} from '@/types/twelvedata';

interface UseTwelveDataWebSocketOptions {
  apiKey: string;
  autoConnect?: boolean;
  heartbeatInterval?: number; // in milliseconds
}

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  subscribedSymbols: string[];
  priceData: Map<string, TwelveDataWebSocketPriceData>;
  subscriptionStatus: TwelveDataWebSocketSubscribeStatus | null;
}

export function useTwelveDataWebSocket({
  apiKey,
  autoConnect = false,
  heartbeatInterval = 1000 // 1 seconds
}: UseTwelveDataWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    subscribedSymbols: [],
    priceData: new Map(),
    subscriptionStatus: null
  });

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const wsUrl = `wss://ws.twelvedata.com/v1/quotes/price?apikey=${apiKey}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setState((prev) => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null
        }));
        reconnectAttempts.current = 0;

        // Start heartbeat
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
        }
        heartbeatRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: 'heartbeat' }));
          }
        }, heartbeatInterval);
      };

      ws.onmessage = (event) => {
        try {
          const data: TwelveDataWebSocketResponse = JSON.parse(event.data);

          switch (data.event) {
            case 'subscribe-status':
              const statusData = data as TwelveDataWebSocketSubscribeStatus;
              setState((prev) => ({
                ...prev,
                subscriptionStatus: statusData,
                subscribedSymbols:
                  statusData.success?.map((s) => s.symbol) || []
              }));
              break;

            case 'price':
              const priceData = data as TwelveDataWebSocketPriceData;
              setState((prev) => ({
                ...prev,
                priceData: new Map(prev.priceData).set(
                  priceData.symbol,
                  priceData
                )
              }));
              break;

            case 'error':
              const errorData = data as TwelveDataWebSocketError;
              setState((prev) => ({
                ...prev,
                error: errorData.message
              }));
              break;

            case 'reset-status':
              // Handle reset status event - typically indicates successful reset
              setState((prev) => ({
                ...prev,
                subscribedSymbols: [], // Clear subscribed symbols on reset
                priceData: new Map() // Clear price data on reset
              }));
              break;

            case 'heartbeat':
              // Handle heartbeat response from server
              break;

            default:
              console.log('Unknown event type:', data);
          }
        } catch (error) {
          setState((prev) => ({
            ...prev,
            error: 'Failed to parse WebSocket message'
          }));
        }
      };

      ws.onclose = (event) => {
        setState((prev) => ({
          ...prev,
          isConnected: false,
          isConnecting: false
        }));

        // Clear heartbeat
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }
        // Attempt to reconnect if not a manual close
        if (
          event.code !== 1000 &&
          reconnectAttempts.current < maxReconnectAttempts
        ) {
          reconnectAttempts.current++;
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttempts.current),
            30000
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        setState((prev) => ({
          ...prev,
          isConnecting: false,
          error: 'WebSocket connection error'
        }));
      };

      wsRef.current = ws;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create WebSocket connection'
      }));
    }
  }, [apiKey, heartbeatInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      error: null
    }));
  }, []);

  const subscribe = useCallback((symbols: string | string[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setState((prev) => ({
        ...prev,
        error: 'WebSocket is not connected'
      }));
      return;
    }

    const symbolList = Array.isArray(symbols) ? symbols : [symbols];
    const message: TwelveDataWebSocketSubscription = {
      action: 'subscribe',
      params: {
        symbols: symbolList.join(',')
      }
    };

    wsRef.current.send(JSON.stringify(message));
  }, []);

  const unsubscribe = useCallback((symbols: string | string[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setState((prev) => ({
        ...prev,
        error: 'WebSocket is not connected'
      }));
      return;
    }

    const symbolList = Array.isArray(symbols) ? symbols : [symbols];
    const message: TwelveDataWebSocketSubscription = {
      action: 'unsubscribe',
      params: {
        symbols: symbolList.join(',')
      }
    };

    wsRef.current.send(JSON.stringify(message));
  }, []);

  const reset = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setState((prev) => ({
        ...prev,
        error: 'WebSocket is not connected'
      }));
      return;
    }

    const message: TwelveDataWebSocketSubscription = {
      action: 'reset'
    };

    wsRef.current.send(JSON.stringify(message));

    setState((prev) => ({
      ...prev,
      subscribedSymbols: [],
      priceData: new Map(),
      subscriptionStatus: null
    }));
  }, []);

  const sendHeartbeat = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const message: TwelveDataWebSocketSubscription = {
      action: 'heartbeat'
    };

    wsRef.current.send(JSON.stringify(message));
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && apiKey) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, apiKey, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    reset,
    sendHeartbeat
  };
}

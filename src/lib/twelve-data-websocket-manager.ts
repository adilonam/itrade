import type {
  TwelveDataWebSocketError,
  TwelveDataWebSocketPriceData,
  TwelveDataWebSocketResponse,
  TwelveDataWebSocketSubscribeStatus,
  TwelveDataWebSocketSubscription
} from '@/types/twelvedata';

export interface TwelveDataWebSocketSnapshot {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  subscribedSymbols: string[];
  priceData: Map<string, TwelveDataWebSocketPriceData>;
  subscriptionStatus: TwelveDataWebSocketSubscribeStatus | null;
}

const SERVER_SNAPSHOT: TwelveDataWebSocketSnapshot = {
  isConnected: false,
  isConnecting: false,
  error: null,
  subscribedSymbols: [],
  priceData: new Map(),
  subscriptionStatus: null
};

function createInitialSnapshot(): TwelveDataWebSocketSnapshot {
  return {
    isConnected: false,
    isConnecting: false,
    error: null,
    subscribedSymbols: [],
    priceData: new Map(),
    subscriptionStatus: null
  };
}

class TwelveDataWebSocketManager {
  private ws: WebSocket | null = null;
  private apiKey = '';
  private consumerCount = 0;
  private heartbeatInterval = 1000;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private desiredSymbols = new Set<string>();
  private ackedSymbols = new Set<string>();
  private listeners = new Set<() => void>();
  private snapshot: TwelveDataWebSocketSnapshot = createInitialSnapshot();

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): TwelveDataWebSocketSnapshot {
    return this.snapshot;
  }

  getServerSnapshot(): TwelveDataWebSocketSnapshot {
    return SERVER_SNAPSHOT;
  }

  acquire(
    apiKey: string,
    autoConnect: boolean,
    heartbeatInterval = 1000
  ): () => void {
    this.consumerCount += 1;
    this.apiKey = apiKey;
    this.heartbeatInterval = heartbeatInterval;

    if (autoConnect && apiKey) {
      this.connect();
    }

    return () => {
      this.consumerCount = Math.max(0, this.consumerCount - 1);
      if (this.consumerCount === 0) {
        this.disconnect();
      }
    };
  }

  connect(): void {
    if (!this.apiKey) return;

    const existing = this.ws;
    if (
      existing &&
      (existing.readyState === WebSocket.OPEN ||
        existing.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    if (existing) {
      existing.close(1000, 'Replacing connection');
      this.ws = null;
    }

    this.setSnapshot({ isConnecting: true, error: null });

    try {
      const wsUrl = `wss://ws.twelvedata.com/v1/quotes/price?apikey=${this.apiKey}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setSnapshot({
          isConnected: true,
          isConnecting: false,
          error: null
        });
        this.startHeartbeat(ws);
        this.flushSymbolSubscriptions();
      };

      ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      ws.onclose = (event) => {
        this.clearHeartbeat();
        this.ws = null;
        this.ackedSymbols.clear();
        this.setSnapshot({
          isConnected: false,
          isConnecting: false
        });

        if (
          event.code !== 1000 &&
          this.consumerCount > 0 &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          this.reconnectAttempts += 1;
          const delay = Math.min(
            1000 * Math.pow(2, this.reconnectAttempts),
            30000
          );
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
          }, delay);
        }
      };

      ws.onerror = () => {
        this.setSnapshot({
          isConnecting: false,
          error: 'WebSocket connection error'
        });
      };

      this.ws = ws;
    } catch (error) {
      this.setSnapshot({
        isConnecting: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create WebSocket connection'
      });
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.clearHeartbeat();
    this.reconnectAttempts = 0;

    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }

    this.ackedSymbols.clear();
    this.setSnapshot({
      isConnected: false,
      isConnecting: false,
      error: null
    });
  }

  setDesiredSymbols(symbols: Iterable<string>): void {
    const next = new Set(symbols);
    const changed =
      next.size !== this.desiredSymbols.size ||
      Array.from(next).some((symbol) => !this.desiredSymbols.has(symbol));

    if (!changed) return;

    this.desiredSymbols = next;
    this.flushSymbolSubscriptions();
  }

  subscribeSymbols(symbols: string | string[]): void {
    const symbolList = Array.isArray(symbols) ? symbols : [symbols];
    let changed = false;

    for (const symbol of symbolList) {
      if (!this.desiredSymbols.has(symbol)) {
        this.desiredSymbols.add(symbol);
        changed = true;
      }
    }

    if (changed) {
      this.flushSymbolSubscriptions();
    }
  }

  unsubscribeSymbols(symbols: string | string[]): void {
    const symbolList = Array.isArray(symbols) ? symbols : [symbols];
    let changed = false;

    for (const symbol of symbolList) {
      if (this.desiredSymbols.delete(symbol)) {
        changed = true;
      }
    }

    if (!changed) return;

    const active = this.ws;
    if (active?.readyState === WebSocket.OPEN) {
      this.send({
        action: 'unsubscribe',
        params: { symbols: symbolList.join(',') }
      });
      for (const symbol of symbolList) {
        this.ackedSymbols.delete(symbol);
      }
    }
  }

  reset(): void {
    const active = this.ws;
    if (!active || active.readyState !== WebSocket.OPEN) {
      this.setSnapshot({ error: 'WebSocket is not connected' });
      return;
    }

    this.send({ action: 'reset' });
    this.ackedSymbols.clear();
    this.setSnapshot({
      subscribedSymbols: [],
      priceData: new Map(),
      subscriptionStatus: null
    });
  }

  sendHeartbeat(): void {
    const active = this.ws;
    if (!active || active.readyState !== WebSocket.OPEN) return;
    this.send({ action: 'heartbeat' });
  }

  private flushSymbolSubscriptions(): void {
    const active = this.ws;
    if (!active || active.readyState !== WebSocket.OPEN) return;

    const pending = Array.from(this.desiredSymbols).filter(
      (symbol) => !this.ackedSymbols.has(symbol)
    );

    if (pending.length === 0) return;

    this.send({
      action: 'subscribe',
      params: { symbols: pending.join(',') }
    });
  }

  private handleMessage(raw: string): void {
    try {
      const data: TwelveDataWebSocketResponse = JSON.parse(raw);

      switch (data.event) {
        case 'subscribe-status': {
          const statusData = data as TwelveDataWebSocketSubscribeStatus;
          statusData.success?.forEach((entry) => {
            this.ackedSymbols.add(entry.symbol);
          });
          this.setSnapshot({
            subscriptionStatus: statusData,
            subscribedSymbols:
              statusData.success?.map((entry) => entry.symbol) ?? []
          });
          this.flushSymbolSubscriptions();
          break;
        }
        case 'price': {
          const priceData = data as TwelveDataWebSocketPriceData;
          const nextPrices = new Map(this.snapshot.priceData);
          nextPrices.set(priceData.symbol, priceData);
          this.setSnapshot({ priceData: nextPrices });
          break;
        }
        case 'error': {
          const errorData = data as TwelveDataWebSocketError;
          this.setSnapshot({ error: errorData.message });
          break;
        }
        case 'reset-status':
          this.ackedSymbols.clear();
          this.setSnapshot({
            subscribedSymbols: [],
            priceData: new Map(),
            subscriptionStatus: null
          });
          this.flushSymbolSubscriptions();
          break;
        default:
          break;
      }
    } catch {
      this.setSnapshot({ error: 'Failed to parse WebSocket message' });
    }
  }

  private send(message: TwelveDataWebSocketSubscription): void {
    const active = this.ws;
    if (!active || active.readyState !== WebSocket.OPEN) {
      this.setSnapshot({ error: 'WebSocket is not connected' });
      return;
    }

    active.send(JSON.stringify(message));
  }

  private startHeartbeat(ws: WebSocket): void {
    this.clearHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'heartbeat' }));
      }
    }, this.heartbeatInterval);
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private setSnapshot(partial: Partial<TwelveDataWebSocketSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...partial };
    this.listeners.forEach((listener) => listener());
  }
}

export const twelveDataWebSocketManager = new TwelveDataWebSocketManager();

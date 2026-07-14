import type {
  TwelveDataRestPricePayload,
  TwelveDataWebSocketError,
  TwelveDataWebSocketMessageProcessing,
  TwelveDataWebSocketPriceData,
  TwelveDataWebSocketResponse,
  TwelveDataWebSocketSubscribeStatus,
  TwelveDataWebSocketSubscription
} from '@/types/twelvedata';

export interface TwelveDataWebSocketSnapshot {
  isConnected: boolean;
  isConnecting: boolean;
  isFallbackMode: boolean;
  restOnlyMode: boolean;
  error: string | null;
  errorLog: string[];
  subscribedSymbols: string[];
  excludedSymbols: string[];
  priceData: Map<string, TwelveDataWebSocketPriceData>;
  subscriptionStatus: TwelveDataWebSocketSubscribeStatus | null;
}

const MAX_ERROR_LOG_ENTRIES = 50;

export function isMeaningfulWsErrorMessage(
  message: string | null | undefined
): message is string {
  if (!message) return false;
  const trimmed = message.trim();
  if (!trimmed) return false;
  return /[a-zA-Z0-9]/.test(trimmed);
}

function joinWsErrorParts(
  parts: Array<string | null | undefined>
): string | null {
  const meaningful = parts
    .map((part) => part?.trim())
    .filter((part): part is string => isMeaningfulWsErrorMessage(part));
  return meaningful.length > 0 ? meaningful.join('; ') : null;
}

function formatSubscribeFailMessage(entry: {
  symbol: string;
  message: string;
}): string | null {
  const message = entry.message?.trim();
  if (isMeaningfulWsErrorMessage(message)) {
    return `${entry.symbol}: ${message}`;
  }
  if (entry.symbol?.trim()) {
    return `Subscription failed for ${entry.symbol}`;
  }
  return null;
}

const DEFAULT_HEARTBEAT_INTERVAL_MS = 10_000;
const FALLBACK_WS_RECONNECT_DELAY_MS = 60_000;

const LOG_PREFIX = '[TwelveDataWS]';

function wsTimestamp(): string {
  return new Date().toISOString();
}

function maskApiKey(apiKey: string): string {
  if (!apiKey) return '(empty)';
  if (apiKey.length <= 8) return '****';
  return `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}`;
}

function formatWsUrlForLog(apiKey: string): string {
  return `wss://ws.twelvedata.com/v1/quotes/price?apikey=${maskApiKey(apiKey)}`;
}

function wsLog(message: string, data?: Record<string, unknown>): void {
  if (data) {
    console.log(`${LOG_PREFIX} ${message}`, data);
  } else {
    console.log(`${LOG_PREFIX} ${message}`);
  }
}

function wsWarn(message: string, data?: Record<string, unknown>): void {
  if (data) {
    console.warn(`${LOG_PREFIX} ${message}`, data);
  } else {
    console.warn(`${LOG_PREFIX} ${message}`);
  }
}

const SERVER_SNAPSHOT: TwelveDataWebSocketSnapshot = {
  isConnected: false,
  isConnecting: false,
  isFallbackMode: false,
  restOnlyMode: false,
  error: null,
  errorLog: [],
  subscribedSymbols: [],
  excludedSymbols: [],
  priceData: new Map(),
  subscriptionStatus: null
};

function createInitialSnapshot(): TwelveDataWebSocketSnapshot {
  return {
    isConnected: false,
    isConnecting: false,
    isFallbackMode: false,
    restOnlyMode: false,
    error: null,
    errorLog: [],
    subscribedSymbols: [],
    excludedSymbols: [],
    priceData: new Map(),
    subscriptionStatus: null
  };
}

class TwelveDataWebSocketManager {
  private ws: WebSocket | null = null;
  private apiKey = '';
  private consumerCount = 0;
  private heartbeatInterval = DEFAULT_HEARTBEAT_INTERVAL_MS;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private fallbackReconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private desiredSymbols = new Set<string>();
  private ackedSymbols = new Set<string>();
  private excludedSymbols = new Set<string>();
  private listeners = new Set<() => void>();
  private snapshot: TwelveDataWebSocketSnapshot = createInitialSnapshot();
  private isConnecting = false;
  private abnormalCloseCount = 0;
  private restOnlyModeLocked = false;

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
    heartbeatInterval = DEFAULT_HEARTBEAT_INTERVAL_MS
  ): () => void {
    this.consumerCount += 1;
    this.apiKey = apiKey;
    this.heartbeatInterval = heartbeatInterval;

    wsLog('acquire', {
      timestamp: wsTimestamp(),
      consumerCount: this.consumerCount,
      autoConnect,
      apiKey: maskApiKey(apiKey)
    });

    if (this.restOnlyModeLocked) {
      this.setSnapshot({
        restOnlyMode: true,
        isFallbackMode: true,
        isConnected: false,
        isConnecting: false
      });
    } else if (autoConnect && apiKey) {
      this.connect();
    }

    return () => {
      this.consumerCount = Math.max(0, this.consumerCount - 1);
      wsLog('release', {
        timestamp: wsTimestamp(),
        consumerCount: this.consumerCount
      });
      if (this.consumerCount === 0) {
        this.disconnect();
      }
    };
  }

  connect(): void {
    if (this.restOnlyModeLocked || this.snapshot.restOnlyMode) {
      wsLog('connect skipped', { reason: 'REST-only mode locked for session' });
      return;
    }

    if (!this.apiKey || this.consumerCount === 0) {
      wsLog('connect skipped', {
        reason: !this.apiKey ? 'no api key' : 'no consumers',
        consumerCount: this.consumerCount
      });
      return;
    }

    const existing = this.ws;
    if (
      existing &&
      (existing.readyState === WebSocket.OPEN ||
        existing.readyState === WebSocket.CONNECTING)
    ) {
      wsLog('connect skipped', {
        reason: 'already open or connecting',
        readyState: existing.readyState
      });
      return;
    }

    if (this.isConnecting) {
      wsLog('connect skipped', { reason: 'connection in progress' });
      return;
    }

    if (existing) {
      wsLog('replacing existing WebSocket', {
        readyState: existing.readyState
      });
      existing.close(1000, 'Replacing connection');
      this.ws = null;
    }

    this.isConnecting = true;
    this.setSnapshot({ isConnecting: true, error: null });

    try {
      const wsUrl = `wss://ws.twelvedata.com/v1/quotes/price?apikey=${this.apiKey}`;
      wsLog('creating WebSocket', {
        timestamp: wsTimestamp(),
        url: formatWsUrlForLog(this.apiKey),
        reconnectAttempt: this.reconnectAttempts,
        isFallbackMode: this.snapshot.isFallbackMode
      });
      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      ws.onopen = () => {
        if (this.ws !== ws) return;
        wsLog('onopen', {
          timestamp: wsTimestamp(),
          reconnectAttempts: this.reconnectAttempts
        });
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.exitFallbackMode();
        this.setSnapshot({
          isConnected: true,
          isConnecting: false,
          error: null
        });
        this.startHeartbeat(ws);
        this.flushSymbolSubscriptions();
      };

      ws.onmessage = (event) => {
        if (this.ws !== ws) return;
        this.handleMessage(event.data);
      };

      ws.onclose = (event) => {
        if (this.ws !== ws) return;

        wsLog('onclose', {
          timestamp: wsTimestamp(),
          code: event.code,
          reason: event.reason || '(none)',
          wasClean: event.wasClean,
          isFallbackMode: this.snapshot.isFallbackMode,
          reconnectAttempts: this.reconnectAttempts,
          consumerCount: this.consumerCount
        });

        this.isConnecting = false;
        this.clearHeartbeat();
        this.ws = null;
        this.ackedSymbols.clear();
        this.setSnapshot({
          isConnected: false,
          isConnecting: false
        });

        const closeMessage = this.formatCloseEventMessage(event);

        if (event.code === 1006) {
          this.abnormalCloseCount += 1;
          wsWarn('abnormal close (1006)', {
            timestamp: wsTimestamp(),
            count: this.abnormalCloseCount
          });

          if (this.abnormalCloseCount >= 2) {
            this.enterRestOnlyMode(
              closeMessage ?? 'Repeated abnormal WebSocket closure (code 1006)'
            );
            return;
          }
        }

        if (this.snapshot.restOnlyMode || this.restOnlyModeLocked) return;
        if (this.snapshot.isFallbackMode) return;

        if (closeMessage) {
          this.recordWsError(closeMessage);
        }

        if (
          this.consumerCount > 0 &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          const delay = Math.min(
            1000 * Math.pow(2, this.reconnectAttempts),
            30_000
          );
          this.reconnectAttempts += 1;
          this.scheduleReconnect(delay);
          return;
        }

        if (this.consumerCount > 0) {
          this.enterFallbackMode('WebSocket disconnected');
        }
      };

      ws.onerror = () => {
        if (this.ws !== ws) return;
        wsWarn('onerror', { timestamp: wsTimestamp() });
        this.isConnecting = false;
        const message = 'WebSocket connection error';
        this.setSnapshot({
          isConnecting: false,
          error: message,
          errorLog: this.appendErrorLogEntry(message)
        });
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to create WebSocket connection';
      wsWarn('connect failed', {
        timestamp: wsTimestamp(),
        error: message
      });
      this.isConnecting = false;
      this.setSnapshot({
        isConnecting: false,
        error: message
      });
      if (this.consumerCount > 0) {
        this.enterFallbackMode(message);
      }
    }
  }

  disconnect(): void {
    wsLog('disconnect', { timestamp: wsTimestamp() });
    this.clearAllReconnectTimers();
    this.clearHeartbeat();
    this.reconnectAttempts = 0;
    this.isConnecting = false;

    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }

    this.ackedSymbols.clear();
    this.excludedSymbols.clear();

    const restOnlyLocked = this.restOnlyModeLocked;
    this.setSnapshot({
      isConnected: false,
      isConnecting: false,
      isFallbackMode: restOnlyLocked,
      restOnlyMode: restOnlyLocked,
      error: restOnlyLocked ? this.snapshot.error : null,
      errorLog: restOnlyLocked ? this.snapshot.errorLog : [],
      excludedSymbols: [],
      subscribedSymbols: []
    });
  }

  setDesiredSymbols(symbols: Iterable<string>): void {
    const next = new Set(symbols);
    const removed = Array.from(this.desiredSymbols).filter(
      (symbol) => !next.has(symbol)
    );
    const added = Array.from(next).filter(
      (symbol) => !this.desiredSymbols.has(symbol)
    );

    if (removed.length === 0 && added.length === 0) return;

    wsLog('setDesiredSymbols', {
      added,
      removed,
      total: next.size,
      isFallbackMode: this.snapshot.isFallbackMode
    });

    this.desiredSymbols = next;

    if (this.snapshot.isFallbackMode) {
      wsLog('setDesiredSymbols skipped WS ops', {
        reason: 'fallback mode',
        total: next.size
      });
      return;
    }

    const active = this.ws;
    if (active?.readyState === WebSocket.OPEN && removed.length > 0) {
      this.send({
        action: 'unsubscribe',
        params: { symbols: removed.join(',') }
      });
      for (const symbol of removed) {
        this.ackedSymbols.delete(symbol);
        this.excludedSymbols.delete(symbol);
      }
    }

    if (removed.length > 0) {
      this.setSnapshot({ excludedSymbols: this.getExcludedSymbolsArray() });
    }

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
      wsLog('subscribeSymbols', { symbols: symbolList });
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

    wsLog('unsubscribeSymbols', { symbols: symbolList });

    const active = this.ws;
    if (
      active?.readyState === WebSocket.OPEN &&
      !this.snapshot.isFallbackMode
    ) {
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
      wsWarn('reset skipped', { reason: 'WebSocket is not connected' });
      this.recordWsError('WebSocket is not connected');
      return;
    }

    wsLog('reset');
    this.send({ action: 'reset' });
    this.ackedSymbols.clear();
    this.excludedSymbols.clear();
    this.setSnapshot({
      subscribedSymbols: [],
      excludedSymbols: [],
      priceData: new Map(),
      subscriptionStatus: null
    });
  }

  sendHeartbeat(): void {
    const active = this.ws;
    if (!active || active.readyState !== WebSocket.OPEN) return;
    if (this.snapshot.isFallbackMode) return;
    this.send({ action: 'heartbeat' });
  }

  applyRestPrices(
    prices: Record<string, TwelveDataRestPricePayload | null | undefined>
  ): void {
    const nextPrices = new Map(this.snapshot.priceData);
    let changed = false;

    for (const payload of Object.values(prices)) {
      if (!payload) continue;
      nextPrices.set(payload.symbol, {
        event: 'price',
        symbol: payload.symbol,
        price: payload.price,
        timestamp: payload.timestamp
      });
      changed = true;
    }

    if (changed) {
      this.setSnapshot({ priceData: nextPrices });
    }
  }

  private enterRestOnlyMode(reason: string): void {
    if (this.restOnlyModeLocked) return;

    this.restOnlyModeLocked = true;

    wsWarn('entering REST-only mode for session', {
      timestamp: wsTimestamp(),
      reason,
      abnormalCloseCount: this.abnormalCloseCount
    });

    this.clearAllReconnectTimers();
    this.clearHeartbeat();
    this.isConnecting = false;
    this.reconnectAttempts = 0;

    if (this.ws) {
      this.ws.close(1000, 'Entering REST-only mode');
      this.ws = null;
    }

    this.ackedSymbols.clear();

    const errorMessage = isMeaningfulWsErrorMessage(reason)
      ? reason.trim()
      : 'WebSocket unavailable — using REST-only prices';

    this.setSnapshot({
      restOnlyMode: true,
      isFallbackMode: true,
      isConnected: false,
      isConnecting: false,
      error: errorMessage,
      errorLog: this.appendErrorLogEntry(
        'REST-only mode: repeated abnormal WebSocket closure (1006)'
      )
    });
  }

  private enterFallbackMode(reason: string): void {
    if (this.restOnlyModeLocked || this.snapshot.restOnlyMode) {
      wsLog('enterFallbackMode skipped', { reason: 'REST-only mode locked' });
      return;
    }

    wsWarn('entering fallback mode', {
      timestamp: wsTimestamp(),
      reason,
      reconnectDelayMs: FALLBACK_WS_RECONNECT_DELAY_MS
    });
    this.clearAllReconnectTimers();
    this.clearHeartbeat();
    this.isConnecting = false;

    if (this.ws) {
      this.ws.close(1000, 'Entering REST fallback');
      this.ws = null;
    }

    this.ackedSymbols.clear();

    const errorMessage = isMeaningfulWsErrorMessage(reason)
      ? reason.trim()
      : 'WebSocket disconnected';

    this.setSnapshot({
      isFallbackMode: true,
      isConnected: false,
      isConnecting: false,
      error: errorMessage,
      errorLog: this.appendErrorLogEntry(errorMessage)
    });

    this.scheduleFallbackReconnect();
  }

  private exitFallbackMode(): void {
    if (this.restOnlyModeLocked || this.snapshot.restOnlyMode) return;

    if (this.fallbackReconnectTimer) {
      clearTimeout(this.fallbackReconnectTimer);
      this.fallbackReconnectTimer = null;
    }

    if (!this.snapshot.isFallbackMode) return;

    wsLog('exiting fallback mode', { timestamp: wsTimestamp() });

    this.reconnectAttempts = 0;
    this.setSnapshot({
      isFallbackMode: false,
      error: null
    });
  }

  private scheduleFallbackReconnect(): void {
    if (
      this.restOnlyModeLocked ||
      this.snapshot.restOnlyMode ||
      this.fallbackReconnectTimer ||
      this.consumerCount === 0
    ) {
      return;
    }

    wsLog('scheduling fallback reconnect', {
      delayMs: FALLBACK_WS_RECONNECT_DELAY_MS
    });

    this.fallbackReconnectTimer = setTimeout(() => {
      this.fallbackReconnectTimer = null;

      if (this.consumerCount === 0) return;

      wsLog('fallback reconnect timer fired', {
        timestamp: wsTimestamp()
      });

      this.reconnectAttempts = 0;
      this.setSnapshot({
        isFallbackMode: false,
        error: null
      });
      this.connect();
    }, FALLBACK_WS_RECONNECT_DELAY_MS);
  }

  private scheduleReconnect(delay: number): void {
    if (
      this.reconnectTimer ||
      this.snapshot.isFallbackMode ||
      this.restOnlyModeLocked ||
      this.snapshot.restOnlyMode
    ) {
      return;
    }
    if (!this.apiKey || this.consumerCount === 0) return;

    wsLog('scheduling reconnect', {
      delayMs: delay,
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts
    });

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      wsLog('reconnect timer fired', {
        timestamp: wsTimestamp(),
        attempt: this.reconnectAttempts
      });
      this.connect();
    }, delay);
  }

  private clearAllReconnectTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.fallbackReconnectTimer) {
      clearTimeout(this.fallbackReconnectTimer);
      this.fallbackReconnectTimer = null;
    }
  }

  private getExcludedSymbolsArray(): string[] {
    return Array.from(this.excludedSymbols).sort((a, b) => a.localeCompare(b));
  }

  private getWsSubscribableSymbols(): string[] {
    return Array.from(this.desiredSymbols).filter(
      (symbol) => !this.excludedSymbols.has(symbol)
    );
  }

  private handlePartialSubscribeFailure(
    failedSymbols: string[],
    errorMessages: string[]
  ): void {
    let nextErrorLog = this.snapshot.errorLog;
    for (const message of errorMessages) {
      nextErrorLog = this.appendErrorLogEntryTo(nextErrorLog, message);
    }

    for (const symbol of failedSymbols) {
      this.excludedSymbols.add(symbol);
      this.ackedSymbols.delete(symbol);
    }

    wsWarn('partial subscribe failure', {
      failedSymbols,
      errorMessages,
      excludedSymbols: this.getExcludedSymbolsArray()
    });

    const lastError = errorMessages[errorMessages.length - 1];

    this.setSnapshot({
      excludedSymbols: this.getExcludedSymbolsArray(),
      errorLog: nextErrorLog,
      error: isMeaningfulWsErrorMessage(lastError)
        ? lastError.trim()
        : this.snapshot.error,
      subscribedSymbols: Array.from(this.ackedSymbols).sort((a, b) =>
        a.localeCompare(b)
      ),
      subscriptionStatus: null
    });

    this.flushSymbolSubscriptions();
  }

  private flushSymbolSubscriptions(): void {
    if (this.snapshot.isFallbackMode) return;

    const active = this.ws;
    if (!active || active.readyState !== WebSocket.OPEN) return;

    const pending = this.getWsSubscribableSymbols().filter(
      (symbol) => !this.ackedSymbols.has(symbol)
    );

    if (pending.length === 0) return;

    wsLog('subscribe', {
      symbols: pending,
      count: pending.length
    });

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
          if (statusData.status === 'error') {
            wsWarn('subscribe-status error', {
              fails: statusData.fails,
              success: statusData.success?.map((e) => e.symbol)
            });
            const failedSymbols = Array.from(
              new Set(
                statusData.fails
                  ?.map((entry) => entry.symbol?.trim())
                  .filter((symbol): symbol is string => Boolean(symbol)) ??
                  []
              )
            );
            const errorMessages =
              statusData.fails
                ?.map((entry) => formatSubscribeFailMessage(entry))
                .filter(isMeaningfulWsErrorMessage) ?? [];

            statusData.success?.forEach((entry) => {
              this.ackedSymbols.add(entry.symbol);
            });

            if (failedSymbols.length > 0) {
              this.handlePartialSubscribeFailure(
                failedSymbols,
                errorMessages.length > 0
                  ? errorMessages
                  : failedSymbols.map(
                      (symbol) => `Subscription failed for ${symbol}`
                    )
              );
              break;
            }

            const reason =
              joinWsErrorParts(errorMessages) ?? 'Subscription error';
            this.enterFallbackMode(reason);
            break;
          }
          statusData.success?.forEach((entry) => {
            this.ackedSymbols.add(entry.symbol);
          });
          wsLog('subscribe-status ok', {
            success: statusData.success?.map((e) => e.symbol),
            ackedCount: this.ackedSymbols.size
          });
          this.setSnapshot({
            subscriptionStatus: statusData,
            subscribedSymbols: Array.from(this.ackedSymbols).sort((a, b) =>
              a.localeCompare(b)
            )
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
          const reason =
            joinWsErrorParts([errorData.message]) ??
            'WebSocket error event received';
          wsWarn('error event', { message: errorData.message, reason });
          this.enterFallbackMode(reason);
          break;
        }
        case 'message-processing': {
          const processingData = data as TwelveDataWebSocketMessageProcessing;
          if (processingData.status === 'error') {
            const reason =
              joinWsErrorParts(processingData.messages ?? []) ??
              'Message processing error';
            wsWarn('message-processing error', {
              messages: processingData.messages,
              reason
            });
            this.enterFallbackMode(reason);
          }
          break;
        }
        case 'reset-status':
          wsLog('reset-status received');
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
      wsWarn('failed to parse WebSocket message');
      this.recordWsError('Failed to parse WebSocket message');
    }
  }

  private send(message: TwelveDataWebSocketSubscription): void {
    if (this.snapshot.isFallbackMode) return;

    const active = this.ws;
    if (!active || active.readyState !== WebSocket.OPEN) {
      wsWarn('send skipped', {
        action: message.action,
        reason: 'WebSocket is not connected'
      });
      this.recordWsError('WebSocket is not connected');
      return;
    }

    if (message.action !== 'heartbeat') {
      wsLog('send', { action: message.action, params: message.params });
    }

    active.send(JSON.stringify(message));
  }

  private startHeartbeat(ws: WebSocket): void {
    this.clearHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.snapshot.isFallbackMode) return;
      if (this.ws !== ws || ws.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify({ action: 'heartbeat' }));
    }, this.heartbeatInterval);
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private formatCloseEventMessage(event: CloseEvent): string | null {
    const reason = event.reason?.trim();
    if (isMeaningfulWsErrorMessage(reason)) {
      return `WebSocket closed (${event.code}): ${reason}`;
    }
    if (event.code !== 1000) {
      return `WebSocket closed (code ${event.code})`;
    }
    return null;
  }

  private appendErrorLogEntry(message: string): string[] {
    return this.appendErrorLogEntryTo(this.snapshot.errorLog, message);
  }

  private appendErrorLogEntryTo(
    log: string[],
    message: string
  ): string[] {
    const trimmed = message.trim();
    const next = [...log];
    if (next[next.length - 1] !== trimmed) {
      next.push(trimmed);
    }
    return next.length > MAX_ERROR_LOG_ENTRIES
      ? next.slice(-MAX_ERROR_LOG_ENTRIES)
      : next;
  }

  private recordWsError(message: string): void {
    if (!isMeaningfulWsErrorMessage(message)) return;
    const trimmed = message.trim();
    wsWarn('recorded error', { message: trimmed });
    this.setSnapshot({
      error: trimmed,
      errorLog: this.appendErrorLogEntry(trimmed)
    });
  }

  private setSnapshot(partial: Partial<TwelveDataWebSocketSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...partial };
    this.listeners.forEach((listener) => listener());
  }
}

export const twelveDataWebSocketManager = new TwelveDataWebSocketManager();

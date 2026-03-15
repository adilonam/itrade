export interface TwelveDataPriceResponse {
  price: string;
}

export interface TwelveDataQuoteResponse {
  symbol: string;
  name: string;
  exchange: string;
  mic_code: string;
  currency: string;
  datetime: string;
  timestamp: number;
  last_quote_at: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  previous_close: string;
  change: string;
  percent_change: string;
  average_volume: string;
  rolling_1day_change: string;
  rolling_7day_change: string;
  rolling_period_change: string;
  is_market_open: boolean;
  fifty_two_week: {
    low: string;
    high: string;
    low_change: string;
    high_change: string;
    low_change_percent: string;
    high_change_percent: string;
    range: string;
  };
  extended_change: string;
  extended_percent_change: string;
  extended_price: string;
  extended_timestamp: string;
}

export interface TwelveDataErrorResponse {
  error: string;
  message?: string;
}

export interface TwelveDataRsiResponse {
  meta: {
    symbol: string;
    interval: string;
    indicator: { name: string; series_type: string; time_period: number };
  };
  values: Array<{ datetime: string; rsi: string }>;
  status: string;
}

export interface TwelveDataCombinedResponse extends TwelveDataQuoteResponse {
  // This extends the quote response and adds current live price
  current_price: string; // Current live price from the price endpoint
  bid: string; // Calculated bid price
  ask: string; // Calculated ask price
  spread: string; // Calculated spread
}

// WebSocket Types
export interface TwelveDataWebSocketMessage {
  event: 'subscribe-status' | 'price' | 'error' | 'reset-status' | 'heartbeat';
  status?: 'ok' | 'error';
  message?: string;
}

export interface TwelveDataWebSocketSubscribeStatus
  extends TwelveDataWebSocketMessage {
  event: 'subscribe-status';
  status: 'ok' | 'error';
  success?: Array<{
    symbol: string;
    exchange: string;
    country: string;
    type: string;
  }>;
  fails?: Array<{
    symbol: string;
    message: string;
  }>;
}

export interface TwelveDataWebSocketPriceData
  extends TwelveDataWebSocketMessage {
  event: 'price';
  symbol: string;
  currency?: string;
  currency_base?: string;
  currency_quote?: string;
  exchange?: string;
  type?: string;
  timestamp: number;
  price: number;
  day_volume?: number;
  bid?: number;
  ask?: number;
}

export interface TwelveDataWebSocketError extends TwelveDataWebSocketMessage {
  event: 'error';
  message: string;
}

export interface TwelveDataWebSocketResetStatus
  extends TwelveDataWebSocketMessage {
  event: 'reset-status';
  status: 'ok' | 'error';
}

export type TwelveDataWebSocketResponse =
  | TwelveDataWebSocketSubscribeStatus
  | TwelveDataWebSocketPriceData
  | TwelveDataWebSocketError
  | TwelveDataWebSocketResetStatus
  | TwelveDataWebSocketMessage;

export interface TwelveDataWebSocketSubscription {
  action: 'subscribe' | 'unsubscribe' | 'reset' | 'heartbeat';
  params?: {
    symbols:
      | string
      | Array<{
          symbol: string;
          exchange?: string;
          mic_code?: string;
          type?: string;
        }>;
  };
}

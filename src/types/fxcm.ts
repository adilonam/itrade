// FXCM API Types
export interface FXCMSymbol {
  symbol: string;
  visible: boolean;
  decimals: number;
  currency: string;
  productType: number;
  ratePrecision: number;
}

export interface TwelveDataPrice {
  symbol: string;
  bid: number;
  ask: number;
  high: number;
  low: number;
  time: string;
}

export interface FXCMSubscriptionResponse {
  response: {
    executed: boolean;
    error?: string;
  };
}

export interface FXCMPriceUpdate {
  Updated: number;
  Rates: Array<{
    Symbol: string;
    Bid: number;
    Ask: number;
    High: number;
    Low: number;
    Time: string;
  }>;
}

// Our API Response Types
export interface FXCMResponse {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  midPrice: number;
  high: number;
  low: number;
  time: string;
  timestamp: number;
}

export interface FXCMError {
  error: string;
  message?: string;
}

// FXCM Authentication Types
export interface FXCMAuthRequest {
  user_id: string;
  password: string;
}

export interface FXCMAuthResponse {
  response: {
    executed: boolean;
    error?: string;
  };
  data?: {
    session_id: string;
  };
}

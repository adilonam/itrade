// AlphaVantage API Types
export interface AlphaVantageMetaData {
  '1. Information': string;
  '2. Symbol': string;
  '3. Last Refreshed': string;
  '4. Interval'?: string;
  '5. Output Size': string;
  '6. Time Zone': string;
}

export interface TimeSeriesData {
  '1. open': string;
  '2. high': string;
  '3. low': string;
  '4. close': string;
  '5. volume': string;
}

export interface IntradayTimeSeriesResponse {
  'Meta Data': AlphaVantageMetaData;
  'Time Series (1min)': Record<string, TimeSeriesData>;
}

export interface DailyTimeSeriesResponse {
  'Meta Data': AlphaVantageMetaData;
  'Time Series (Daily)': Record<string, TimeSeriesData>;
}

// API Response Types
export interface AlphaVantageResponse {
  symbol: string;
  currentPrice: number;
  lastRefreshed: string;
  priceChange: number;
  priceChangePercent: number;
  dailyClosePrice: number;
  volume: string;
  timeZone: string;
}

export interface AlphaVantageError {
  error: string;
  message?: string;
}

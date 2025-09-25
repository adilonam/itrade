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

export interface TwelveDataCombinedResponse extends TwelveDataQuoteResponse {
  // This extends the quote response and adds current live price
  current_price: string; // Current live price from the price endpoint
}

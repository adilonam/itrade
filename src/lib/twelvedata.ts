import type {
  TwelveDataPriceResponse,
  TwelveDataQuoteResponse,
  TwelveDataErrorResponse,
  TwelveDataCombinedResponse,
  TwelveDataRsiResponse,
  TwelveDataEmaResponse,
  TwelveDataRestPricePayload
} from '@/types/twelvedata';
import { prisma } from '@/lib/prisma';
import {
  getTwelveDataServerApiKey,
  TWELVE_DATA_SERVER_KEY_ENV
} from '@/lib/twelve-data-config';

class TwelveDataService {
  private readonly baseUrl = 'https://api.twelvedata.com';

  private missingApiKeyError(): TwelveDataErrorResponse {
    return {
      error: 'Twelve Data API key not configured',
      message: `Set ${TWELVE_DATA_SERVER_KEY_ENV} in your environment`
    };
  }

  private apiKey(): string | null {
    return getTwelveDataServerApiKey();
  }

  /**
   * Get current price for a symbol
   */
  async getPrice(
    symbol: string
  ): Promise<TwelveDataPriceResponse | TwelveDataErrorResponse> {
    try {
      const apiKey = this.apiKey();
      if (!apiKey) {
        return this.missingApiKeyError();
      }

      const url = new URL(`${this.baseUrl}/price`);
      url.searchParams.set('symbol', symbol);
      url.searchParams.set('apikey', apiKey);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return {
          error: 'Failed to fetch price data from Twelve Data',
          message: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();

      // Check if the response contains an error
      if (data.code && data.message) {
        return {
          error: 'Twelve Data API error',
          message: data.message
        };
      }

      return data as TwelveDataPriceResponse;
    } catch (error) {
      return {
        error: 'Network error occurred while fetching price data',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get detailed quote information for a symbol
   */
  async getQuote(
    symbol: string
  ): Promise<TwelveDataQuoteResponse | TwelveDataErrorResponse> {
    try {
      const apiKey = this.apiKey();
      if (!apiKey) {
        return this.missingApiKeyError();
      }

      const url = new URL(`${this.baseUrl}/quote`);
      url.searchParams.set('symbol', symbol);
      url.searchParams.set('apikey', apiKey);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return {
          error: 'Failed to fetch quote data from Twelve Data',
          message: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();

      // Check if the response contains an error
      if (data.code && data.message) {
        return {
          error: 'Twelve Data API error',
          message: data.message
        };
      }

      return data as TwelveDataQuoteResponse;
    } catch (error) {
      return {
        error: 'Network error occurred while fetching quote data',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Batch /price calls for WebSocket fallback (one credit per symbol).
   */
  async getPricesForSymbols(
    symbols: string[]
  ): Promise<Record<string, TwelveDataRestPricePayload | null>> {
    const unique = Array.from(
      new Set(symbols.map((s) => s.trim().toUpperCase()))
    ).filter(Boolean);

    const entries = await Promise.all(
      unique.map(async (symbol) => {
        const result = await this.getPrice(symbol);
        if ('error' in result) return [symbol, null] as const;

        const price = parseFloat(result.price);
        if (!Number.isFinite(price)) return [symbol, null] as const;

        const payload: TwelveDataRestPricePayload = {
          event: 'price',
          symbol,
          price,
          timestamp: Math.floor(Date.now() / 1000)
        };
        return [symbol, payload] as const;
      })
    );

    const out: Record<string, TwelveDataRestPricePayload | null> = {};
    for (const [symbol, payload] of entries) {
      out[symbol] = payload;
    }
    return out;
  }

  /**
   * REST quotes for landing / ticker UI (parallel /quote calls, one credit per symbol).
   */
  async getQuotesForTape(
    symbols: string[]
  ): Promise<Record<string, { price: number; percentChange: number }>> {
    const unique = Array.from(
      new Set(symbols.map((s) => s.trim().toUpperCase()))
    ).filter(Boolean);
    const entries = await Promise.all(
      unique.map(async (symbol) => {
        const quote = await this.getQuote(symbol);
        if ('error' in quote) return null;
        const price = parseFloat(quote.close);
        const percentChange = parseFloat(quote.percent_change);
        if (Number.isNaN(price)) return null;
        return [
          symbol,
          {
            price,
            percentChange: Number.isNaN(percentChange) ? 0 : percentChange
          }
        ] as const;
      })
    );

    const out: Record<string, { price: number; percentChange: number }> = {};
    for (const row of entries) {
      if (row) out[row[0]] = row[1];
    }
    return out;
  }

  /**
   * Get combined price and quote data for a symbol
   */
  async getCombinedData(
    symbol: string
  ): Promise<TwelveDataCombinedResponse | TwelveDataErrorResponse> {
    try {
      // Fetch both current price and quote data in parallel
      const [priceResult, quoteResult] = await Promise.all([
        this.getPrice(symbol),
        this.getQuote(symbol)
      ]);

      // Check if either request failed
      if ('error' in priceResult) {
        return priceResult;
      }
      if ('error' in quoteResult) {
        return quoteResult;
      }

      // Get spread from database Market model
      const market = await prisma.market.findFirst({
        where: { symbol: symbol.toUpperCase() }
      });

      // Calculate bid/ask using spread from database (fallback to default if not found)
      const currentPrice = parseFloat(priceResult.price);
      const defaultSpread = 0;
      const spread = market?.spread ?? defaultSpread;
      const bid = currentPrice - spread / 2;
      const ask = currentPrice + spread / 2;

      // Combine the data - use current price from price endpoint, other data from quote
      const combinedData: TwelveDataCombinedResponse = {
        ...quoteResult,
        // Override the close price with the current live price
        close: priceResult.price,
        // Add a current_price field for clarity
        current_price: priceResult.price,
        // Add calculated bid/ask and spread
        bid: bid.toString(),
        ask: ask.toString(),
        spread: spread.toString()
      };

      return combinedData;
    } catch (error) {
      return {
        error: 'Failed to fetch combined market data',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get RSI (Relative Strength Index) for a symbol and interval
   * @see https://api.twelvedata.com/rsi
   */
  async getRsi(
    symbol: string,
    interval: string
  ): Promise<
    | { rsi: number; datetime: string }
    | TwelveDataErrorResponse
  > {
    try {
      const apiKey = this.apiKey();
      if (!apiKey) {
        return this.missingApiKeyError();
      }

      const url = new URL(`${this.baseUrl}/rsi`);
      url.searchParams.set('symbol', symbol);
      url.searchParams.set('interval', interval);
      url.searchParams.set('apikey', apiKey);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        return {
          error: 'Failed to fetch RSI from Twelve Data',
          message: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = (await response.json()) as TwelveDataRsiResponse | TwelveDataErrorResponse;

      if ('error' in data && data.error) {
        return data as TwelveDataErrorResponse;
      }

      const rsiData = data as TwelveDataRsiResponse;
      if (rsiData.status !== 'ok' || !rsiData.values?.length) {
        return {
          error: 'Invalid RSI response',
          message: 'No RSI values returned'
        };
      }

      const latest = rsiData.values[0];
      const rsi = parseFloat(latest.rsi);
      if (Number.isNaN(rsi)) {
        return {
          error: 'Invalid RSI value',
          message: `Could not parse RSI: ${latest.rsi}`
        };
      }

      return { rsi, datetime: latest.datetime };
    } catch (error) {
      return {
        error: 'Network error while fetching RSI',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get EMA (Exponential Moving Average) for a symbol and interval
   * @see https://api.twelvedata.com/ema
   */
  async getEma(
    symbol: string,
    interval: string,
    timePeriod: number = 9
  ): Promise<
    | { ema: number; datetime: string }
    | TwelveDataErrorResponse
  > {
    try {
      const apiKey = this.apiKey();
      if (!apiKey) {
        return this.missingApiKeyError();
      }

      const url = new URL(`${this.baseUrl}/ema`);
      url.searchParams.set('symbol', symbol);
      url.searchParams.set('interval', interval);
      url.searchParams.set('time_period', String(timePeriod));
      url.searchParams.set('apikey', apiKey);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        return {
          error: 'Failed to fetch EMA from Twelve Data',
          message: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = (await response.json()) as TwelveDataEmaResponse | TwelveDataErrorResponse;

      if ('error' in data && data.error) {
        return data as TwelveDataErrorResponse;
      }

      const emaData = data as TwelveDataEmaResponse;
      if (emaData.status !== 'ok' || !emaData.values?.length) {
        return {
          error: 'Invalid EMA response',
          message: 'No EMA values returned'
        };
      }

      const latest = emaData.values[0];
      const ema = parseFloat(latest.ema);
      if (Number.isNaN(ema)) {
        return {
          error: 'Invalid EMA value',
          message: `Could not parse EMA: ${latest.ema}`
        };
      }

      return { ema, datetime: latest.datetime };
    } catch (error) {
      return {
        error: 'Network error while fetching EMA',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const twelveDataService = new TwelveDataService();

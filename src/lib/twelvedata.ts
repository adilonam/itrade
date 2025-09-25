import type {
  TwelveDataPriceResponse,
  TwelveDataQuoteResponse,
  TwelveDataErrorResponse,
  TwelveDataCombinedResponse
} from '@/types/twelvedata';

class TwelveDataService {
  private readonly baseUrl = 'https://api.twelvedata.com';
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.TWELVE_DATA_API_KEY || 'demo';
  }

  /**
   * Get current price for a symbol
   */
  async getPrice(
    symbol: string
  ): Promise<TwelveDataPriceResponse | TwelveDataErrorResponse> {
    try {
      const url = new URL(`${this.baseUrl}/price`);
      url.searchParams.set('symbol', symbol);
      url.searchParams.set('apikey', this.apiKey);

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
      const url = new URL(`${this.baseUrl}/quote`);
      url.searchParams.set('symbol', symbol);
      url.searchParams.set('apikey', this.apiKey);

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

      // Combine the data - use current price from price endpoint, other data from quote
      const combinedData: TwelveDataCombinedResponse = {
        ...quoteResult,
        // Override the close price with the current live price
        close: priceResult.price,
        // Add a current_price field for clarity
        current_price: priceResult.price
      };

      return combinedData;
    } catch (error) {
      return {
        error: 'Failed to fetch combined market data',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const twelveDataService = new TwelveDataService();

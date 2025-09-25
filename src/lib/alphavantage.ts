import {
  IntradayTimeSeriesResponse,
  DailyTimeSeriesResponse,
  AlphaVantageResponse,
  AlphaVantageError
} from '@/types/alphavantage';

const ALPHAVANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

export class AlphaVantageService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.ALPHAVANTAGE_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('ALPHAVANTAGE_API_KEY environment variable is required');
    }
  }

  /**
   * Fetch intraday time series data (1min interval)
   */
  private async fetchIntradayData(
    symbol: string
  ): Promise<IntradayTimeSeriesResponse> {
    const url = `${ALPHAVANTAGE_BASE_URL}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=1min&apikey=${this.apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch intraday data: ${response.statusText}`);
    }

    const data = await response.json();

    // Check for API error responses
    if (data['Error Message']) {
      throw new Error(`AlphaVantage API Error: ${data['Error Message']}`);
    }

    if (data['Note']) {
      throw new Error(`AlphaVantage API Rate Limit: ${data['Note']}`);
    }

    return data as IntradayTimeSeriesResponse;
  }

  /**
   * Fetch daily time series data
   */
  private async fetchDailyData(
    symbol: string
  ): Promise<DailyTimeSeriesResponse> {
    const url = `${ALPHAVANTAGE_BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${this.apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch daily data: ${response.statusText}`);
    }

    const data = await response.json();

    // Check for API error responses
    if (data['Error Message']) {
      throw new Error(`AlphaVantage API Error: ${data['Error Message']}`);
    }

    if (data['Note']) {
      throw new Error(`AlphaVantage API Rate Limit: ${data['Note']}`);
    }

    return data as DailyTimeSeriesResponse;
  }

  /**
   * Get the latest market data for a symbol with price change calculation
   */
  async getMarketData(
    symbol: string
  ): Promise<AlphaVantageResponse | AlphaVantageError> {
    try {
      // Fetch both intraday and daily data in parallel
      const [intradayData, dailyData] = await Promise.all([
        this.fetchIntradayData(symbol),
        this.fetchDailyData(symbol)
      ]);

      // Get the most recent intraday data point
      const intradayTimeSeries = intradayData['Time Series (1min)'];
      const intradayKeys = Object.keys(intradayTimeSeries).sort().reverse();

      if (intradayKeys.length === 0) {
        throw new Error('No intraday data available');
      }

      const latestIntradayEntry = intradayTimeSeries[intradayKeys[0]];
      const currentPrice = parseFloat(latestIntradayEntry['4. close']);

      // Get the most recent daily close price
      const dailyTimeSeries = dailyData['Time Series (Daily)'];
      const dailyKeys = Object.keys(dailyTimeSeries).sort().reverse();

      if (dailyKeys.length === 0) {
        throw new Error('No daily data available');
      }

      const latestDailyEntry = dailyTimeSeries[dailyKeys[0]];
      const dailyClosePrice = parseFloat(latestDailyEntry['4. close']);

      // Calculate price change and percentage change
      const priceChange = currentPrice - dailyClosePrice;
      const priceChangePercent = (priceChange / dailyClosePrice) * 100;

      return {
        symbol: intradayData['Meta Data']['2. Symbol'],
        currentPrice,
        lastRefreshed: intradayData['Meta Data']['3. Last Refreshed'],
        priceChange,
        priceChangePercent,
        dailyClosePrice,
        volume: latestIntradayEntry['5. volume'],
        timeZone: intradayData['Meta Data']['6. Time Zone']
      };
    } catch (error) {
      return {
        error: 'Failed to fetch market data',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Export a singleton instance
export const alphaVantageService = new AlphaVantageService();

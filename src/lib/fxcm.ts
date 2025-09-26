import {
  FXCMResponse,
  FXCMError,
  FXCMSymbol,
  FXCMSubscriptionResponse
} from '@/types/fxcm';

export class FXCMService {
  private apiUrl: string;
  private apiKey: string;
  private userId: string;
  private sessionId: string | null = null;

  constructor() {
    this.apiUrl = process.env.FXCM_API_URL || 'https://api-demo.fxcm.com';
    this.apiKey = process.env.FXCM_API_KEY || '';
    this.userId = process.env.FXCM_USER_ID || '';

    if (!this.apiKey || !this.userId) {
      throw new Error(
        'FXCM API configuration is required: FXCM_API_KEY and FXCM_USER_ID'
      );
    }
  }

  /**
   * Authenticate with FXCM API and get session ID
   */
  private async authenticate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/trading/open_session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TradingApp/1.0'
        },
        body: JSON.stringify({
          user_id: this.userId,
          password: this.apiKey
        })
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.response?.executed && data.data?.session_id) {
        this.sessionId = data.data.session_id;
        return true;
      }

      throw new Error(data.response?.error || 'Authentication failed');
    } catch (error) {
      throw new Error(
        `FXCM authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get available symbols from FXCM
   */
  private async getSymbols(): Promise<FXCMSymbol[]> {
    if (!this.sessionId) {
      await this.authenticate();
    }

    const response = await fetch(`${this.apiUrl}/trading/get_instruments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TradingApp/1.0'
      },
      body: JSON.stringify({
        session_id: this.sessionId
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get symbols: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.response?.executed) {
      throw new Error(data.response?.error || 'Failed to retrieve symbols');
    }

    return data.data?.instruments || [];
  }

  /**
   * Subscribe to price updates for a symbol
   */
  private async subscribeToSymbol(symbol: string): Promise<boolean> {
    if (!this.sessionId) {
      await this.authenticate();
    }

    const response = await fetch(`${this.apiUrl}/trading/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TradingApp/1.0'
      },
      body: JSON.stringify({
        session_id: this.sessionId,
        symbol: symbol
      })
    });

    if (!response.ok) {
      throw new Error(
        `Failed to subscribe to ${symbol}: ${response.statusText}`
      );
    }

    const data: FXCMSubscriptionResponse = await response.json();

    if (!data.response?.executed) {
      throw new Error(
        data.response?.error || `Failed to subscribe to ${symbol}`
      );
    }

    return true;
  }

  /**
   * Get live price data for a symbol
   */
  async getLivePrice(symbol: string): Promise<FXCMResponse | FXCMError> {
    try {
      // Ensure we have a valid session
      if (!this.sessionId) {
        await this.authenticate();
      }

      // Validate symbol format (FXCM uses format like EUR/USD)
      const formattedSymbol = this.formatSymbol(symbol);

      // Subscribe to the symbol to get live updates
      await this.subscribeToSymbol(formattedSymbol);

      // Get current price data
      const response = await fetch(`${this.apiUrl}/trading/get_prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TradingApp/1.0'
        },
        body: JSON.stringify({
          session_id: this.sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get prices: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.response?.executed) {
        throw new Error(data.response?.error || 'Failed to retrieve prices');
      }

      // Find the price data for our symbol
      const prices = data.data?.prices || [];
      const symbolPrice = prices.find(
        (price: any) =>
          price.Symbol === formattedSymbol || price.symbol === formattedSymbol
      );

      if (!symbolPrice) {
        throw new Error(`No price data found for symbol: ${formattedSymbol}`);
      }

      // Calculate spread and mid price
      const bid = parseFloat(symbolPrice.Bid || symbolPrice.bid || '0');
      const ask = parseFloat(symbolPrice.Ask || symbolPrice.ask || '0');
      const spread = ask - bid;
      const midPrice = (bid + ask) / 2;

      return {
        symbol: formattedSymbol,
        bid,
        ask,
        spread,
        midPrice,
        high: parseFloat(symbolPrice.High || symbolPrice.high || '0'),
        low: parseFloat(symbolPrice.Low || symbolPrice.low || '0'),
        time: symbolPrice.Time || symbolPrice.time || new Date().toISOString(),
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        error: 'Failed to fetch FXCM market data',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Format symbol for FXCM API (e.g., EURUSD -> EUR/USD)
   */
  private formatSymbol(symbol: string): string {
    const upperSymbol = symbol.toUpperCase();

    // If already formatted with slash, return as is
    if (upperSymbol.includes('/')) {
      return upperSymbol;
    }

    // For forex pairs, insert slash after first 3 characters
    if (upperSymbol.length === 6) {
      return `${upperSymbol.slice(0, 3)}/${upperSymbol.slice(3)}`;
    }

    // For other symbols, return as is
    return upperSymbol;
  }

  /**
   * Clean up session when done
   */
  async closeSession(): Promise<void> {
    if (this.sessionId) {
      try {
        await fetch(`${this.apiUrl}/trading/close_session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'TradingApp/1.0'
          },
          body: JSON.stringify({
            session_id: this.sessionId
          })
        });
      } catch (error) {
        // Ignore cleanup errors
      } finally {
        this.sessionId = null;
      }
    }
  }
}

// Export a singleton instance
export const fxcmService = new FXCMService();

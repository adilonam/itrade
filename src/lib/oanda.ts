/**
 * OANDA API utilities for fetching market data
 */

export interface OandaPrice {
  instrument: string;
  bid: string;
  ask: string;
  midPrice: string;
  spread: string;
  timestamp: string;
  status: string;
  tradeable: boolean;
  dailyChange?: {
    value: string;
    percentage: string;
    direction: 'up' | 'down' | 'neutral';
  };
  previousClose?: string;
}

export interface OandaPriceResponse {
  success: boolean;
  data?: {
    prices: OandaPrice[];
    requestedInstruments: string[];
    timestamp: string;
  };
  error?: string;
  details?: string;
}

/**
 * Fetches daily candle data for previous close calculation
 * @param instrument - Single instrument (e.g., "EUR_USD")
 * @param apiKey - OANDA API key
 * @param apiUrl - OANDA API URL
 * @returns Promise with previous close price or null
 */
async function fetchPreviousClose(
  instrument: string,
  apiKey: string,
  apiUrl: string
): Promise<number | null> {
  try {
    const candlesUrl = `${apiUrl}/v3/instruments/${instrument}/candles`;
    const params = new URLSearchParams({
      count: '2',
      granularity: 'D',
      price: 'M'
    });

    const response = await fetch(`${candlesUrl}?${params}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const candles = data.candles;

    if (candles && candles.length >= 1) {
      // Get the most recent completed daily candle
      const previousCandle =
        candles[candles.length - 2] || candles[candles.length - 1];
      return parseFloat(previousCandle.mid.c);
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Fetches pricing data from OANDA API with daily change calculation
 * @param instruments - Comma-separated list of instruments (e.g., "EUR_USD,GBP_USD")
 * @returns Promise with pricing data including daily change
 */
export async function fetchOandaPricing(
  instruments: string
): Promise<OandaPriceResponse> {
  try {
    // Check for required environment variables
    const apiKey = process.env.OANDA_API_KEY;
    const accountId = process.env.OANDA_ACCOUNT_ID;
    const apiUrl =
      process.env.OANDA_API_URL || 'https://api-fxpractice.oanda.com';

    if (!apiKey || !accountId) {
      return {
        success: false,
        error:
          'OANDA configuration missing. Please set OANDA_API_KEY and OANDA_ACCOUNT_ID in your environment variables.'
      };
    }

    // OANDA REST API endpoint for pricing
    const pricingUrl = `${apiUrl}/v3/accounts/${accountId}/pricing`;
    const params = new URLSearchParams({
      instruments: instruments,
      includeHomeConversions: 'false',
      includeUnitsAvailable: 'false'
    });

    // Make request to OANDA API for current pricing
    const response = await fetch(`${pricingUrl}?${params}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `OANDA API error: ${response.status} ${response.statusText}`,
        details: errorText
      };
    }

    const data = await response.json();

    // Extract and format price information
    const prices = data.prices;
    if (!prices || prices.length === 0) {
      return {
        success: false,
        error: 'No price data received from OANDA'
      };
    }

    // Process each instrument and calculate daily change
    const formattedPrices: OandaPrice[] = await Promise.all(
      prices.map(async (price: any) => {
        const bid = parseFloat(price.bids[0].price);
        const ask = parseFloat(price.asks[0].price);
        const midPrice = (bid + ask) / 2;
        const spread = (ask - bid).toFixed(5);

        // Fetch previous close for daily change calculation
        const previousClose = await fetchPreviousClose(
          price.instrument,
          apiKey,
          apiUrl
        );

        let dailyChange = undefined;
        if (previousClose !== null) {
          const changeValue = midPrice - previousClose;
          const changePercentage = (changeValue / previousClose) * 100;

          dailyChange = {
            value: changeValue.toFixed(5),
            percentage: changePercentage.toFixed(2),
            direction:
              changeValue > 0
                ? ('up' as const)
                : changeValue < 0
                  ? ('down' as const)
                  : ('neutral' as const)
          };
        }

        return {
          instrument: price.instrument,
          bid: price.bids[0].price,
          ask: price.asks[0].price,
          midPrice: midPrice.toFixed(5),
          spread: spread,
          timestamp: price.time,
          status: price.status,
          tradeable: price.tradeable,
          dailyChange,
          previousClose: previousClose?.toFixed(5) || undefined
        };
      })
    );

    return {
      success: true,
      data: {
        prices: formattedPrices,
        requestedInstruments: instruments.split(','),
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to fetch pricing data from OANDA',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

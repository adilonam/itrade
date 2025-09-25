import { NextRequest, NextResponse } from 'next/server';
import { twelveDataService } from '@/lib/twelvedata';

/**
 * @swagger
 * /api/twelvedata:
 *   get:
 *     summary: Get comprehensive market data from Twelve Data
 *     description: Fetches real-time price, quote data, and market information for financial instruments from Twelve Data API, including price, change rates, volume, and 52-week ranges
 *     tags:
 *       - Market Data
 *     parameters:
 *       - in: query
 *         name: symbol
 *         schema:
 *           type: string
 *           example: "AAPL"
 *         required: true
 *         description: Financial instrument symbol (e.g., AAPL, MSFT, EURUSD). Case-insensitive.
 *     responses:
 *       200:
 *         description: Successfully retrieved comprehensive market data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 symbol:
 *                   type: string
 *                   example: "AAPL"
 *                   description: The financial instrument symbol
 *                 name:
 *                   type: string
 *                   example: "Apple Inc"
 *                   description: Company or instrument name
 *                 exchange:
 *                   type: string
 *                   example: "NASDAQ"
 *                   description: Trading exchange
 *                 mic_code:
 *                   type: string
 *                   example: "XNAS"
 *                   description: Market identifier code
 *                 currency:
 *                   type: string
 *                   example: "USD"
 *                   description: Trading currency
 *                 datetime:
 *                   type: string
 *                   example: "2021-09-16"
 *                   description: Last trading date
 *                 timestamp:
 *                   type: number
 *                   example: 1631772000
 *                   description: Unix timestamp
 *                 last_quote_at:
 *                   type: number
 *                   example: 1631772000
 *                   description: Last quote timestamp
 *                 open:
 *                   type: string
 *                   example: "148.44000"
 *                   description: Opening price
 *                 high:
 *                   type: string
 *                   example: "148.96840"
 *                   description: Daily high price
 *                 low:
 *                   type: string
 *                   example: "147.22099"
 *                   description: Daily low price
 *                 close:
 *                   type: string
 *                   example: "148.85001"
 *                   description: Previous closing price
 *                 current_price:
 *                   type: string
 *                   example: "149.12000"
 *                   description: Current live market price
 *                 volume:
 *                   type: string
 *                   example: "67903927"
 *                   description: Trading volume
 *                 previous_close:
 *                   type: string
 *                   example: "149.09000"
 *                   description: Previous day's closing price
 *                 change:
 *                   type: string
 *                   example: "-0.23999"
 *                   description: Price change from previous close
 *                 percent_change:
 *                   type: string
 *                   example: "-0.16097"
 *                   description: Percentage change from previous close
 *                 average_volume:
 *                   type: string
 *                   example: "83571571"
 *                   description: Average trading volume
 *                 rolling_1day_change:
 *                   type: string
 *                   example: "123.123"
 *                   description: 1-day rolling change
 *                 rolling_7day_change:
 *                   type: string
 *                   example: "123.123"
 *                   description: 7-day rolling change
 *                 rolling_period_change:
 *                   type: string
 *                   example: "123.123"
 *                   description: Rolling period change
 *                 is_market_open:
 *                   type: boolean
 *                   example: false
 *                   description: Market open status
 *                 fifty_two_week:
 *                   type: object
 *                   properties:
 *                     low:
 *                       type: string
 *                       example: "103.10000"
 *                     high:
 *                       type: string
 *                       example: "157.25999"
 *                     low_change:
 *                       type: string
 *                       example: "45.75001"
 *                     high_change:
 *                       type: string
 *                       example: "-8.40999"
 *                     low_change_percent:
 *                       type: string
 *                       example: "44.37440"
 *                     high_change_percent:
 *                       type: string
 *                       example: "-5.34782"
 *                     range:
 *                       type: string
 *                       example: "103.099998 - 157.259995"
 *                 extended_change:
 *                   type: string
 *                   example: "0.09"
 *                   description: Extended hours price change
 *                 extended_percent_change:
 *                   type: string
 *                   example: "0.05"
 *                   description: Extended hours percentage change
 *                 extended_price:
 *                   type: string
 *                   example: "125.22"
 *                   description: Extended hours price
 *                 extended_timestamp:
 *                   type: string
 *                   example: "1649845281"
 *                   description: Extended hours timestamp
 *       400:
 *         description: Bad request - invalid symbol format or missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Symbol parameter is required"
 *       500:
 *         description: Internal server error or Twelve Data API error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch market data from Twelve Data"
 *                 message:
 *                   type: string
 *                   example: "Invalid symbol"
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required. Example: ?symbol=AAPL' },
        { status: 400 }
      );
    }

    // Validate symbol format (basic validation)
    if (!/^[A-Z0-9\.\/\-]{1,12}$/i.test(symbol)) {
      return NextResponse.json(
        {
          error:
            'Invalid symbol format. Symbol should contain only alphanumeric characters, dots, slashes, or hyphens (e.g., AAPL, EURUSD, BTC-USD).'
        },
        { status: 400 }
      );
    }

    const marketData = await twelveDataService.getCombinedData(
      symbol.toUpperCase()
    );

    // Check if response contains an error
    if ('error' in marketData) {
      return NextResponse.json(marketData, { status: 500 });
    }

    return NextResponse.json(marketData, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

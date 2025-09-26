import { NextRequest, NextResponse } from 'next/server';
import { alphaVantageService } from '@/lib/alphavantage';

/**
 * @swagger
 * /api/alphavantage:
 *   get:
 *     summary: Get real-time market data from AlphaVantage
 *     description: Fetches intraday and daily market data for a financial symbol, including current price, price change, and percentage change against the previous daily close
 *     tags:
 *       - Market Data
 *     parameters:
 *       - in: query
 *         name: symbol
 *         schema:
 *           type: string
 *           example: "EURUSD"
 *         required: true
 *         description: Financial instrument symbol (e.g., EURUSD, AAPL, MSFT)
 *     responses:
 *       200:
 *         description: Successfully retrieved market data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 symbol:
 *                   type: string
 *                   example: "EURUSD"
 *                   description: The financial instrument symbol
 *                 currentPrice:
 *                   type: number
 *                   example: 1.1742
 *                   description: Current price from latest 1-minute data
 *                 lastRefreshed:
 *                   type: string
 *                   example: "2025-09-24 18:07:00"
 *                   description: Timestamp of the last data refresh
 *                 priceChange:
 *                   type: number
 *                   example: -0.0073
 *                   description: Price change from previous daily close
 *                 priceChangePercent:
 *                   type: number
 *                   example: -0.618
 *                   description: Percentage change from previous daily close
 *                 dailyClosePrice:
 *                   type: number
 *                   example: 1.1815
 *                   description: Previous day's closing price
 *                 volume:
 *                   type: string
 *                   example: "0"
 *                   description: Trading volume for the current period
 *                 timeZone:
 *                   type: string
 *                   example: "US/Eastern"
 *                   description: Time zone for the data timestamps
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
 *         description: Internal server error or AlphaVantage API error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch market data"
 *                 message:
 *                   type: string
 *                   example: "AlphaVantage API Rate Limit exceeded"
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required. Example: ?symbol=EURUSD' },
        { status: 400 }
      );
    }

    // Validate symbol format (basic validation)
    if (!/^[A-Z]{2,10}$/.test(symbol.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid symbol format. Symbol should contain only letters.' },
        { status: 400 }
      );
    }

    const marketData = await alphaVantageService.getMarketData(
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

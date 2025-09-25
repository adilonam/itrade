import { NextRequest, NextResponse } from 'next/server';
import { fxcmService } from '@/lib/fxcm';

/**
 * @swagger
 * /api/fxcm:
 *   get:
 *     summary: Get live market data from FXCM
 *     description: Fetches real-time pricing data for financial instruments from FXCM's trading API, including bid, ask, spread, and daily high/low
 *     tags:
 *       - Market Data
 *     parameters:
 *       - in: query
 *         name: symbol
 *         schema:
 *           type: string
 *           example: "EURUSD"
 *         required: true
 *         description: Financial instrument symbol (e.g., EURUSD, GBPUSD, USDJPY). Will be automatically formatted for FXCM API.
 *     responses:
 *       200:
 *         description: Successfully retrieved live market data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 symbol:
 *                   type: string
 *                   example: "EUR/USD"
 *                   description: The formatted financial instrument symbol
 *                 bid:
 *                   type: number
 *                   example: 1.08456
 *                   description: Current bid price
 *                 ask:
 *                   type: number
 *                   example: 1.08459
 *                   description: Current ask price
 *                 spread:
 *                   type: number
 *                   example: 0.00003
 *                   description: Spread between bid and ask prices
 *                 midPrice:
 *                   type: number
 *                   example: 1.08457
 *                   description: Mid price between bid and ask
 *                 high:
 *                   type: number
 *                   example: 1.08500
 *                   description: Daily high price
 *                 low:
 *                   type: number
 *                   example: 1.08400
 *                   description: Daily low price
 *                 time:
 *                   type: string
 *                   example: "2025-09-24T10:30:00.000Z"
 *                   description: Timestamp of the price data
 *                 timestamp:
 *                   type: number
 *                   example: 1727172600000
 *                   description: Unix timestamp in milliseconds
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
 *         description: Internal server error or FXCM API error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch FXCM market data"
 *                 message:
 *                   type: string
 *                   example: "Authentication failed"
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
    if (!/^[A-Z\/]{3,10}$/.test(symbol.toUpperCase())) {
      return NextResponse.json(
        {
          error:
            'Invalid symbol format. Symbol should contain only letters and optionally a slash (e.g., EURUSD or EUR/USD).'
        },
        { status: 400 }
      );
    }

    const marketData = await fxcmService.getLivePrice(symbol.toUpperCase());

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

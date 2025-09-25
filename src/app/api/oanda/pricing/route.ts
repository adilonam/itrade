import { NextRequest, NextResponse } from 'next/server';
import { fetchOandaPricing } from '@/lib/oanda';

/**
 * @swagger
 * /api/oanda/pricing:
 *   get:
 *     summary: Get pricing data from OANDA
 *     description: Fetches current pricing data with daily change for a specific instrument from OANDA's REST API
 *     tags:
 *       - Trading
 *     parameters:
 *       - in: query
 *         name: instrument
 *         schema:
 *           type: string
 *           example: "EUR_USD"
 *         required: true
 *         description: Single instrument to get pricing for (e.g., EUR_USD, GBP_USD, USD_JPY)
 *     responses:
 *       200:
 *         description: Successfully retrieved pricing data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     instrument:
 *                       type: string
 *                       example: "EUR_USD"
 *                     bid:
 *                       type: string
 *                       example: "1.08456"
 *                     ask:
 *                       type: string
 *                       example: "1.08459"
 *                     midPrice:
 *                       type: string
 *                       example: "1.08457"
 *                     spread:
 *                       type: string
 *                       example: "0.00003"
 *                     timestamp:
 *                       type: string
 *                       example: "2025-09-24T10:30:00.000000000Z"
 *                     dailyChange:
 *                       type: object
 *                       properties:
 *                         value:
 *                           type: string
 *                           example: "0.00123"
 *                         percentage:
 *                           type: string
 *                           example: "0.11"
 *                         direction:
 *                           type: string
 *                           enum: ["up", "down", "neutral"]
 *                           example: "up"
 *                     previousClose:
 *                       type: string
 *                       example: "1.08334"
 *       400:
 *         description: Bad request - missing parameters or configuration
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instrument = searchParams.get('instrument');

    if (!instrument) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing required parameter: instrument. Example: ?instrument=EUR_USD'
        },
        { status: 400 }
      );
    }

    const result = await fetchOandaPricing(instrument);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          details: result.details
        },
        { status: result.error?.includes('configuration') ? 400 : 500 }
      );
    }

    // Return just the single instrument data
    const instrumentData = result.data?.prices[0];
    if (!instrumentData) {
      return NextResponse.json(
        {
          success: false,
          error: `No data found for instrument: ${instrument}`
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: instrumentData
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch pricing data from OANDA',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { twelveDataService } from '@/lib/twelvedata';

/**
 * @swagger
 * /api/markets:
 *   get:
 *     summary: Get markets by room type
 *     description: Retrieves visible markets from the database filtered by room type. Supports STOCK, TRADING, STOCK_AND_TRADING, or ALL rooms.
 *     tags:
 *       - Markets
 *     parameters:
 *       - in: query
 *         name: room
 *         schema:
 *           type: string
 *           enum: [STOCK, TRADING, STOCK_AND_TRADING, ALL]
 *           default: ALL
 *         description: Filter markets by room type. Use ALL to get all visible markets regardless of room.
 *     responses:
 *       200:
 *         description: Successfully retrieved markets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 markets:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "clx1234567890abcdef"
 *                         description: Unique identifier for the market
 *                       type:
 *                         type: string
 *                         enum: [FOREX, CRYPTO, STOCKS, COMMODITIES, INDICES]
 *                         example: "FOREX"
 *                         description: Type of market
 *                       symbol:
 *                         type: string
 *                         example: "EURUSD"
 *                         description: Market symbol
 *                       name:
 *                         type: string
 *                         example: "Euro / US Dollar"
 *                         description: Human-readable name of the market
 *                       room:
 *                         type: string
 *                         enum: [STOCK, TRADING]
 *                         example: "TRADING"
 *                         description: Market room type
 *                       spread:
 *                         type: number
 *                         example: 0.00002
 *                         description: Market spread
 *                       lastPrice:
 *                         type: number
 *                         example: 1.0850
 *                         description: Last known price
 *                       lastChange:
 *                         type: number
 *                         example: 0.0012
 *                         description: Last price change
 *                       visible:
 *                         type: boolean
 *                         example: true
 *                         description: Market visibility status
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00.000Z"
 *                         description: When the market was created
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00.000Z"
 *                         description: When the market was last updated
 *       400:
 *         description: Invalid room parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid room parameter"
 *                 message:
 *                   type: string
 *                   example: "Room must be one of: STOCK, TRADING, STOCK_AND_TRADING, ALL"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch markets"
 *                 message:
 *                   type: string
 *                   example: "Database connection error"
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const room = searchParams.get('room')?.toUpperCase() || 'ALL';

    // Validate room parameter
    const validRooms = ['STOCK', 'TRADING'];
    if (!validRooms.includes(room)) {
      return NextResponse.json(
        {
          error: 'Invalid room parameter',
          message: `Room must be one of: ${validRooms.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Build where clause based on room parameter
    const whereClause: any = {
      visible: true
    };

    if (room === 'STOCK') {
      whereClause.room = 'STOCK';
    } else if (room === 'TRADING') {
      whereClause.room = 'TRADING';
    }
    // For 'ALL', we just use visible: true

    // Get markets from database
    const markets = await prisma.market.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Update lastPrice and lastChange for each market using TwelveData
    const updatedMarkets = await Promise.all(
      markets.map(async (market) => {
        try {
          const marketData = await twelveDataService.getCombinedData(
            market.symbol
          );

          if ('error' in marketData) {
            // If API fails, return market with existing data
            return market;
          }

          const lastPrice = parseFloat(
            marketData.current_price ?? marketData.close ?? '0'
          );
          const lastChange = parseFloat(marketData.change ?? '0');

          // Update the market in database
          const updatedMarket = await prisma.market.update({
            where: { id: market.id },
            data: {
              lastPrice: isFinite(lastPrice) ? lastPrice : market.lastPrice,
              lastChange: isFinite(lastChange) ? lastChange : market.lastChange,
              updatedAt: new Date()
            }
          });

          return updatedMarket;
        } catch (error) {
          // If update fails, return original market
          return market;
        }
      })
    );

    return NextResponse.json({ markets: updatedMarkets }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch markets',
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

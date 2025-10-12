import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { twelveDataService } from '@/lib/twelvedata';

/**
 * @swagger
 * /api/markets/get-stock-markets:
 *   get:
 *     summary: Get all visible markets with STOCK room
 *     description: Retrieves all visible markets from the database that have room=STOCK  including their type, symbol, and name. Only returns markets that are set to visible=true for user stock trading.
 *     tags:
 *       - Markets
 *     responses:
 *       200:
 *         description: Successfully retrieved all visible stock markets
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
 *                         example: "STOCKS"
 *                         description: Type of market
 *                       symbol:
 *                         type: string
 *                         example: "AAPL"
 *                         description: Market symbol
 *                       name:
 *                         type: string
 *                         example: "Apple Inc."
 *                         description: Human-readable name of the market
 *                       room:
 *                         type: string
 *                         enum: [STOCK, TRADING]
 *                         example: "STOCK"
 *                         description: Market room type
 *                       spread:
 *                         type: number
 *                         example: 0.00002
 *                         description: Market spread
 *                       lastPrice:
 *                         type: number
 *                         example: 150.25
 *                         description: Last known price
 *                       lastChange:
 *                         type: number
 *                         example: 2.50
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch stock markets"
 *                 message:
 *                   type: string
 *                   example: "Database connection error"
 */
export async function GET() {
  try {
    // Get only visible markets with STOCK  room from database
    const markets = await prisma.market.findMany({
      where: {
        visible: true,
        room: 'STOCK'
      },
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
        } catch (err) {
          // If update fails, return original market data
          return market;
        }
      })
    );

    return NextResponse.json({ markets: updatedMarkets });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch stock markets',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

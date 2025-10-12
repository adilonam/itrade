import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { refreshSaveMarkets } from '@/lib/calculator-server';

/**
 * @swagger
 * /api/user/portfolio/stock:
 *   get:
 *     summary: Get user's stock portfolio aggregated by symbol
 *     tags: [User, Portfolio]
 *     description: Returns aggregated portfolio showing total holdings for each stock with current market prices and P&L
 *     responses:
 *       200:
 *         description: Portfolio aggregated by stock symbol
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 portfolio:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       marketId:
 *                         type: string
 *                       symbol:
 *                         type: string
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *                       totalQuantity:
 *                         type: number
 *                         description: Total shares owned
 *                       averageBuyPrice:
 *                         type: number
 *                         description: Average price paid per share
 *                       currentPrice:
 *                         type: number
 *                         description: Current market price
 *                       totalCost:
 *                         type: number
 *                         description: Total amount invested
 *                       currentValue:
 *                         type: number
 *                         description: Current total value
 *                       totalPnL:
 *                         type: number
 *                         description: Total profit/loss
 *                       pnlPercentage:
 *                         type: number
 *                         description: P&L as percentage
 *                       positionCount:
 *                         type: number
 *                         description: Number of open positions
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all PLACED positions for the user in STOCK rooms
    const positions = await prisma.position.findMany({
      where: {
        userId: session.user.id,
        status: 'PLACED',
        room: 'STOCK',
        type: 'BUY' // Only BUY positions for stock portfolio
      },
      include: {
        market: true
      },
      orderBy: {
        executedAt: 'desc'
      }
    });

    if (positions.length === 0) {
      return NextResponse.json({ portfolio: [] });
    }

    // Get unique markets and refresh their prices
    const uniqueMarkets = positions
      .filter((p) => p.market !== null)
      .map((p) => p.market!)
      .filter(
        (market, index, self) =>
          index === self.findIndex((m) => m.id === market.id)
      );

    await refreshSaveMarkets(uniqueMarkets);

    // Re-fetch positions with updated market prices
    const updatedPositions = await prisma.position.findMany({
      where: {
        userId: session.user.id,
        status: 'PLACED',
        room: 'STOCK',
        type: 'BUY'
      },
      include: {
        market: true
      }
    });

    // Aggregate positions by market
    const portfolioMap = new Map<
      string,
      {
        marketId: string;
        symbol: string;
        name: string;
        type: string;
        totalQuantity: number;
        totalCost: number;
        currentPrice: number;
        positionCount: number;
      }
    >();

    updatedPositions.forEach((position) => {
      if (!position.market || !position.executedPrice) return;

      const key = position.marketId;
      const existing = portfolioMap.get(key);

      if (existing) {
        existing.totalQuantity += position.quantity;
        existing.totalCost += position.quantity * position.executedPrice;
        existing.positionCount += 1;
      } else {
        portfolioMap.set(key, {
          marketId: position.marketId,
          symbol: position.market.symbol,
          name: position.market.name,
          type: position.market.type,
          totalQuantity: position.quantity,
          totalCost: position.quantity * position.executedPrice,
          currentPrice: position.market.lastPrice,
          positionCount: 1
        });
      }
    });

    // Calculate portfolio metrics
    const portfolio = Array.from(portfolioMap.values()).map((item) => {
      const averageBuyPrice = item.totalCost / item.totalQuantity;
      const currentValue = item.totalQuantity * item.currentPrice;
      const totalPnL = currentValue - item.totalCost;
      const pnlPercentage = (totalPnL / item.totalCost) * 100;

      return {
        marketId: item.marketId,
        symbol: item.symbol,
        name: item.name,
        type: item.type,
        totalQuantity: item.totalQuantity,
        averageBuyPrice,
        currentPrice: item.currentPrice,
        totalCost: item.totalCost,
        currentValue,
        totalPnL,
        pnlPercentage,
        positionCount: item.positionCount
      };
    });

    // Sort by current value descending
    portfolio.sort((a, b) => b.currentValue - a.currentValue);

    return NextResponse.json({ portfolio });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Portfolio fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
}

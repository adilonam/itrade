import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { refreshSaveMarkets } from '@/lib/calculator-server';

/**
 * @swagger
 * /api/user/portfolio/stock/sell:
 *   post:
 *     summary: Sell all positions for a specific stock
 *     tags: [User, Portfolio]
 *     description: Closes all PLACED BUY positions for a stock, updates user balance, and creates a transaction record
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [marketId]
 *             properties:
 *               marketId:
 *                 type: string
 *                 description: The market ID of the stock to sell
 *     responses:
 *       200:
 *         description: Successfully sold all positions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 closedPositions:
 *                   type: number
 *                 totalQuantity:
 *                   type: number
 *                 totalProceeds:
 *                   type: number
 *                 totalPnL:
 *                   type: number
 *                 newBalance:
 *                   type: number
 *       400:
 *         description: Invalid input or no positions found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { marketId } = body;

    if (!marketId) {
      return NextResponse.json(
        { error: 'Market ID is required' },
        { status: 400 }
      );
    }

    // Get all PLACED BUY positions for this market
    const positions = await prisma.position.findMany({
      where: {
        userId: session.user.id,
        marketId,
        status: 'PLACED',
        type: 'BUY',
        room: 'STOCK'
      },
      include: {
        market: true
      }
    });

    if (positions.length === 0) {
      return NextResponse.json(
        { error: 'No open positions found for this stock' },
        { status: 400 }
      );
    }

    // Get market and refresh its price
    const market = positions[0].market;
    if (!market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }

    await refreshSaveMarkets([market]);

    // Re-fetch market with updated price
    const updatedMarket = await prisma.market.findUnique({
      where: { id: marketId }
    });

    if (!updatedMarket) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }

    const currentPrice = updatedMarket.lastPrice;

    // Calculate total quantity, cost, proceeds, and PnL
    let totalQuantity = 0;
    let totalCost = 0;
    let totalProceeds = 0;

    positions.forEach((position) => {
      if (position.executedPrice) {
        totalQuantity += position.quantity;
        totalCost += position.quantity * position.executedPrice;
        totalProceeds += position.quantity * currentPrice;
      }
    });

    const totalPnL = totalProceeds - totalCost;

    // Start a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Close all positions
      const closedPositions = await tx.position.updateMany({
        where: {
          id: {
            in: positions.map((p) => p.id)
          }
        },
        data: {
          status: 'CLOSED',
          closedPrice: currentPrice,
          closedAt: new Date(),
          pnl: totalPnL / positions.length // Distribute PnL across positions
        }
      });

      // Update user balance (add proceeds from sale)
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: {
          balance: {
            increment: totalProceeds
          }
        },
        select: {
          balance: true
        }
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: totalPnL >= 0 ? 'GAIN' : 'LOSS',
          amount: Math.abs(totalPnL),
          description: `Sold ${totalQuantity} ${market.symbol} at ${currentPrice.toFixed(2)} - ${totalPnL >= 0 ? 'Profit' : 'Loss'}: ${Math.abs(totalPnL).toFixed(2)}`
        }
      });

      return {
        closedPositions: closedPositions.count,
        newBalance: updatedUser.balance
      };
    });

    return NextResponse.json({
      message: 'Successfully sold all positions',
      closedPositions: result.closedPositions,
      totalQuantity,
      totalProceeds,
      totalPnL,
      newBalance: result.newBalance
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Sell portfolio error:', error);
    return NextResponse.json(
      {
        error: 'Failed to sell positions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

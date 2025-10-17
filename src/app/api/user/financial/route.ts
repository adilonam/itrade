import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculatePositionPnL } from '@/lib/calculator-server';
import { Market, Position } from '@prisma/client';

/**
 * @swagger
 * /api/user/financial:
 *   get:
 *     summary: Get current user's financial metrics
 *     tags: [User, Financial]
 *     description: Calculates and returns comprehensive financial metrics including balance, margin, equity, and PnL
 *     responses:
 *       200:
 *         description: User's financial metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: number
 *                   description: User's account balance
 *                 usedMargin:
 *                   type: number
 *                   description: Total margin currently in use from all PLACED positions
 *                 equity:
 *                   type: number
 *                   description: Balance + Total PnL (account value including unrealized profits/losses)
 *                 freeMargin:
 *                   type: number
 *                   description: Equity - Used Margin (available margin for new positions)
 *                 marginLevel:
 *                   type: number
 *                   nullable: true
 *                   description: (Equity / Used Margin) * 100 - percentage indicator of account health (null if no margin used)
 *                 totalPnL:
 *                   type: number
 *                   description: Sum of all unrealized PnL from PLACED positions
 *                 leverage:
 *                   type: number
 *                   description: User's leverage setting
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

    // Get user with balance and leverage
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        balance: true,
        leverage: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all PLACED positions for the user
    const placedPositions = await prisma.position.findMany({
      where: {
        userId: session.user.id,
        status: 'PLACED'
      },
      include: {
        market: true
      }
    });

    // Calculate total PnL and used margin
    // Note: refreshSaveMarkets is called inside calculatePositionPnL for each position
    let totalPnL = 0;
    let usedMargin = 0;

    // Calculate PnL for each PLACED position
    const pnlCalculations = await Promise.all(
      placedPositions.map(async (position) => {
        // Calculate PnL
        const pnl = await calculatePositionPnL(
          position as Position & { market: Market }
        );

        // Sum up used margin
        const positionMargin = position.requiredMargin || 0;

        return {
          pnl: pnl || 0,
          margin: positionMargin
        };
      })
    );

    // Sum all PnLs and margins
    pnlCalculations.forEach((calc) => {
      totalPnL += calc.pnl;
      usedMargin += calc.margin;
    });

    // Calculate financial metrics
    const balance = user.balance;
    const equity = balance + totalPnL;
    const freeMargin = equity - usedMargin;
    const marginLevel = usedMargin > 0 ? (equity / usedMargin) * 100 : null;

    return NextResponse.json({
      balance: Number(balance.toFixed(2)),
      usedMargin: Number(usedMargin.toFixed(2)),
      equity: Number(equity.toFixed(2)),
      freeMargin: Number(freeMargin.toFixed(2)),
      marginLevel: marginLevel !== null ? Number(marginLevel.toFixed(2)) : null,
      totalPnL: Number(totalPnL.toFixed(2)),
      leverage: user.leverage
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Financial metrics calculation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to calculate financial metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { calculateUserFinancialInfo } from '@/lib/calculator-server';

/**
 * @swagger
 * /api/user/financial:
 *   get:
 *     summary: Get current user's financial metrics
 *     tags: [User, Financial]
 *     description: Calculates and returns comprehensive financial metrics including balance, margin, equity, and PnL
 *     parameters:
 *       - in: query
 *         name: room
 *         schema:
 *           type: string
 *           enum: [STOCK, TRADING, ALL]
 *         description: Filter positions by room (STOCK, TRADING, or ALL). Defaults to ALL (calculates for both rooms).
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
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get room query parameter
    const searchParams = request.nextUrl.searchParams;
    const roomParam = searchParams.get('room');
    const room: 'STOCK' | 'TRADING' | 'ALL' =
      roomParam && ['STOCK', 'TRADING', 'ALL'].includes(roomParam)
        ? (roomParam as 'STOCK' | 'TRADING' | 'ALL')
        : 'ALL';

    // Get user with required fields
    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Use the centralized financial calculation function
    const financialInfo = await calculateUserFinancialInfo(user, room);

    if (!financialInfo) {
      return NextResponse.json(
        { error: 'Failed to calculate financial information' },
        { status: 500 }
      );
    }

    return NextResponse.json(financialInfo);
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

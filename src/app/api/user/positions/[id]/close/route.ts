import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  refreshSaveMarkets,
  calculatePositionPnL
} from '@/lib/calculator-server';
import { Market, Position, TransactionType } from '@prisma/client';

/**
 * @swagger
 * /api/user/positions/{id}/close:
 *   patch:
 *     summary: Close/cancel a position for current user
 *     tags: [User, Positions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Position ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [CLOSED]
 *                 default: CANCELLED
 *                 description: New status for the position
 *     responses:
 *       200:
 *         description: Position closed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - position doesn't belong to user
 *       404:
 *         description: Position not found
 *       500:
 *         description: Internal server error
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status = 'CLOSED' } = body;

    // Validate status
    if (status !== 'CLOSED') {
      return NextResponse.json(
        { error: 'Invalid status. Must be CLOSED' },
        { status: 400 }
      );
    }

    // Find the position and verify ownership
    const existingPosition = await prisma.position.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        market: true
      }
    });

    if (!existingPosition) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    // Check if position belongs to current user
    if (existingPosition.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - position does not belong to user' },
        { status: 403 }
      );
    }

    // Check if position can be closed (not already closed)
    if (['CLOSED'].includes(existingPosition.status)) {
      return NextResponse.json(
        { error: 'Position is already closed' },
        { status: 400 }
      );
    }

    // Refresh market data and calculate P&L for BUY/SELL positions
    let closedPrice: number | null = null;
    let calculatedPnL: number | null = null;

    if (
      existingPosition.market &&
      ['BUY', 'SELL'].includes(existingPosition.type)
    ) {
      // Refresh market data
      const refreshedMarkets = await refreshSaveMarkets([
        existingPosition.market as Market
      ]);
      if (refreshedMarkets && refreshedMarkets.length > 0) {
        // Calculate bid/ask prices based on market spread
        const market = existingPosition.market;
        const midPrice = market.lastPrice ?? 0;
        const spread = market.spread ?? 0;
        const bidPrice = midPrice - spread / 2;
        const askPrice = midPrice + spread / 2;

        // Use ask price for BUY, bid price for SELL
        closedPrice = existingPosition.type === 'BUY' ? askPrice : bidPrice;

        // Calculate P&L for the position
        const positionWithClosedPrice = {
          ...existingPosition,
          closedPrice: closedPrice,
          status: 'CLOSED' as const // Temporarily set to CLOSED for P&L calculation
        };

        calculatedPnL = await calculatePositionPnL(
          positionWithClosedPrice as Position & { market: Market }
        );

        if (calculatedPnL !== null) {
          console.log(
            `Calculated P&L for position ${id}: ${calculatedPnL.toFixed(2)}`
          );
        } else {
          console.warn(`Unable to calculate P&L for position ${id}`);
        }
      } else {
        console.warn(
          `Unable to refresh market data for ${existingPosition.market.symbol}`
        );
      }
    }

    // Update position, user balance, and create transaction in a single transaction
    const updatedPosition = await prisma.$transaction(async (tx) => {
      // Update the position with P&L
      const updatedPosition = await tx.position.update({
        where: { id },
        data: {
          status,
          closedPrice: closedPrice || undefined,
          closedAt: new Date(),
          pnl: calculatedPnL || 0
        }
      });

      // Update user balance and create transaction if P&L is calculated
      if (calculatedPnL !== null && calculatedPnL !== 0) {
        const transactionType: TransactionType =
          calculatedPnL > 0 ? 'GAIN' : 'LOSS';
        const absoluteAmount = Math.abs(calculatedPnL);

        // Update user balance
        await tx.user.update({
          where: { id: session.user.id },
          data: {
            balance: {
              increment: calculatedPnL // Add P&L to balance (negative for losses)
            }
          }
        });

        // Create transaction record
        await tx.transaction.create({
          data: {
            userId: session.user.id,
            type: transactionType,
            abosulteAmount: absoluteAmount,
            description: `Position ${existingPosition.type} closed - ${existingPosition.market?.symbol || 'Unknown'}`
          }
        });
      }

      return updatedPosition;
    });

    return NextResponse.json(updatedPosition);
  } catch (error) {
    console.error('Error closing position:', error);
    return NextResponse.json(
      { error: 'Failed to close position' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  refreshSaveMarkets,
  calculatePositionPnL
} from '@/lib/calculator-server';
import {
  Market,
  Position,
  TransactionType
} from '@/lib/prisma/generated/client';

/**
 * @swagger
 * /api/user/positions/{id}/close:
 *   patch:
 *     summary: Close/cancel a position for current user (supports partial closing for STOCK room)
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
 *                 default: CLOSED
 *                 description: New status for the position
 *               amount:
 *                 type: number
 *                 description: Amount to close (for STOCK room only). If less than position quantity, the position will be split into two - one closed and one remaining open.
 *     responses:
 *       200:
 *         description: Position closed successfully. For partial closes, returns both closed and remaining positions.
 *       400:
 *         description: Bad request - invalid amount or position already closed
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
    const { status = 'CLOSED', amount } = body;

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

    // Handle partial position closing for STOCK room
    const isPartialClose =
      existingPosition.room === 'STOCK' &&
      amount !== undefined &&
      amount > 0 &&
      amount < (existingPosition.quantity || 0);

    // Validate amount for STOCK room
    if (existingPosition.room === 'STOCK' && amount !== undefined) {
      if (amount <= 0) {
        return NextResponse.json(
          { error: 'Amount must be greater than 0' },
          { status: 400 }
        );
      }
      if (amount > (existingPosition.quantity || 0)) {
        return NextResponse.json(
          { error: 'Amount cannot exceed position quantity' },
          { status: 400 }
        );
      }
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

        // Calculate P&L for the position (or partial amount)
        const quantityToClose = isPartialClose
          ? amount
          : existingPosition.quantity;

        const positionWithClosedPrice = {
          ...existingPosition,
          quantity: quantityToClose,
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
    const result = await prisma.$transaction(async (tx) => {
      if (isPartialClose) {
        // Handle partial close: Split position into two
        const remainingAmount = (existingPosition.quantity || 0) - amount!;

        // Update original position to SPLITTED
        await tx.position.update({
          where: { id },
          data: {
            status: 'SPLITTED'
          }
        });

        // Create new position with amount to be closed
        const closedPosition = await tx.position.create({
          data: {
            userId: existingPosition.userId,
            marketId: existingPosition.marketId,
            type: existingPosition.type,
            room: existingPosition.room,
            quantity: amount,
            executedPrice: existingPosition.executedPrice,
            closedPrice: closedPrice || undefined,
            takeProfit: existingPosition.takeProfit,
            stopLoss: existingPosition.stopLoss,
            requiredMargin: existingPosition.requiredMargin
              ? (existingPosition.requiredMargin /
                  (existingPosition.quantity || 1)) *
                amount
              : undefined,
            status: 'CLOSED',
            executedAt: new Date(),
            closedAt: new Date(),
            pnl: calculatedPnL || 0,
            description: `Partial close - ${amount} of ${existingPosition.quantity} shares`
          }
        });

        // Create new position with remaining amount (PLACED)
        const remainingPosition = await tx.position.create({
          data: {
            userId: existingPosition.userId,
            marketId: existingPosition.marketId,
            type: existingPosition.type,
            room: existingPosition.room,
            quantity: remainingAmount,
            executedPrice: existingPosition.executedPrice,
            takeProfit: existingPosition.takeProfit,
            stopLoss: existingPosition.stopLoss,
            requiredMargin: existingPosition.requiredMargin
              ? (existingPosition.requiredMargin /
                  (existingPosition.quantity || 1)) *
                remainingAmount
              : undefined,
            status: 'PLACED',
            executedAt: new Date(),
            description: `Remaining - ${remainingAmount} of ${existingPosition.quantity} shares`
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
                increment: calculatedPnL
              }
            }
          });

          // Create transaction record
          await tx.transaction.create({
            data: {
              userId: session.user.id,
              type: transactionType,
              absoluteAmount: absoluteAmount,
              description: `Partial position ${existingPosition.type} closed - ${existingPosition.market?.symbol || 'Unknown'} (${amount} shares)`
            }
          });
        }

        return { closedPosition, remainingPosition };
      } else {
        // Handle full close
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
                increment: calculatedPnL
              }
            }
          });

          // Create transaction record
          await tx.transaction.create({
            data: {
              userId: session.user.id,
              type: transactionType,
              absoluteAmount: absoluteAmount,
              description: `Position ${existingPosition.type} closed - ${existingPosition.market?.symbol || 'Unknown'}`
            }
          });
        }

        return { closedPosition: updatedPosition };
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error closing position:', error);
    return NextResponse.json(
      { error: 'Failed to close position' },
      { status: 500 }
    );
  }
}

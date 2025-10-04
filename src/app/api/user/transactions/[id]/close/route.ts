import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { refreshMarkets, calculateTransactionPnL } from '@/lib/pnl-calculator';
import { Market } from '@prisma/client';

/**
 * @swagger
 * /api/user/transactions/{id}/close:
 *   patch:
 *     summary: Close/cancel a transaction for current user
 *     tags: [User, Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
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
 *                 description: New status for the transaction
 *     responses:
 *       200:
 *         description: Transaction closed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - transaction doesn't belong to user
 *       404:
 *         description: Transaction not found
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

    // Find the transaction and verify ownership
    const existingTransaction = await prisma.transaction.findUnique({
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

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Check if transaction belongs to current user
    if (existingTransaction.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - transaction does not belong to user' },
        { status: 403 }
      );
    }

    // Check if transaction can be closed (not already closed)
    if (['CLOSED'].includes(existingTransaction.status)) {
      return NextResponse.json(
        { error: 'Transaction is already closed' },
        { status: 400 }
      );
    }

    // Refresh market data and calculate P&L for BUY/SELL transactions
    let closedPrice = null;
    let calculatedPnL = null;

    if (
      existingTransaction.market &&
      ['BUY', 'SELL'].includes(existingTransaction.type)
    ) {
      // Refresh market data
      const refreshedMarkets = await refreshMarkets([
        existingTransaction.market as Market
      ]);
      if (refreshedMarkets && refreshedMarkets.length > 0) {
        // Calculate bid/ask prices based on market spread
        const market = existingTransaction.market;
        const midPrice = market.lastPrice ?? 0;
        const spread = market.spread ?? 0;
        const bidPrice = midPrice - spread / 2;
        const askPrice = midPrice + spread / 2;

        // Use ask price for BUY, bid price for SELL
        closedPrice = existingTransaction.type === 'BUY' ? askPrice : bidPrice;

        // Calculate P&L for the transaction
        const transactionWithClosedPrice = {
          ...existingTransaction,
          closedPrice: closedPrice,
          status: 'CLOSED' as const // Temporarily set to CLOSED for P&L calculation
        };

        calculatedPnL = await calculateTransactionPnL(
          transactionWithClosedPrice
        );

        if (calculatedPnL !== null) {
          console.log(
            `Calculated P&L for transaction ${id}: ${calculatedPnL.toFixed(2)}`
          );
        } else {
          console.warn(`Unable to calculate P&L for transaction ${id}`);
        }
      } else {
        console.warn(
          `Unable to refresh market data for ${existingTransaction.market.symbol}`
        );
      }
    }

    // Update the transaction with P&L
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        status,
        closedPrice: closedPrice || undefined,
        closedAt: new Date(),
        pnl: calculatedPnL || 0
      }
    });

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('Error closing transaction:', error);
    return NextResponse.json(
      { error: 'Failed to close transaction' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchCurrentPrice } from '@/lib/pnl-calculator';

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
        market: {
          select: {
            id: true,
            symbol: true,
            name: true,
            type: true,
            lastPrice: true
          }
        }
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
    if (['CLOSED', 'FAILED'].includes(existingTransaction.status)) {
      return NextResponse.json(
        { error: 'Transaction is already closed' },
        { status: 400 }
      );
    }

    // Fetch closed price for BUY/SELL transactions
    let closedPrice = null;
    if (
      existingTransaction.market &&
      ['BUY', 'SELL'].includes(existingTransaction.type)
    ) {
      closedPrice = await fetchCurrentPrice(existingTransaction.market);
      if (closedPrice === null) {
        console.warn(
          `Unable to fetch closed price for ${existingTransaction.market.symbol}`
        );
      }
    }

    // Update the transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        status,
        closedPrice: closedPrice || undefined,
        closedAt: new Date(),
        executedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        market: {
          select: {
            id: true,
            symbol: true,
            name: true,
            type: true,
            lastPrice: true
          }
        }
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

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Position } from '@prisma/client';

// Update position data type
type UpdatePositionData = Partial<Position>;

/**
 * @swagger
 * /api/admin/positions/{id}:
 *   get:
 *     summary: Get a specific position by ID
 *     tags: [Admin, Positions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Position ID
 *     responses:
 *       200:
 *         description: Position details
 *       404:
 *         description: Position not found
 *   put:
 *     summary: Update a position
 *     tags: [Admin, Positions]
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
 *               type:
 *                 type: string
 *                 enum: [BUY, SELL, DEPOSIT, WITHDRAWAL, TRANSFER_IN, TRANSFER_OUT, FEE, BONUS, REFUND]
 *               status:
 *                 type: string
 *                 enum: [PLACED, CLOSED, FAILED, PENDING]
 *               marketId:
 *                 type: string
 *               quantity:
 *                 type: number
 *               description:
 *                 type: string
 *               executedAt:
 *                 type: string
 *                 format: date-time
 *               pnl:
 *                 type: number
 *     responses:
 *       200:
 *         description: Position updated successfully
 *       404:
 *         description: Position not found
 *       400:
 *         description: Invalid input data
 *   delete:
 *     summary: Delete a position
 *     tags: [Admin, Positions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Position ID
 *     responses:
 *       200:
 *         description: Position deleted successfully
 *       404:
 *         description: Position not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const position = await prisma.position.findUnique({
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
            type: true
          }
        }
      }
    });

    if (!position) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(position);
  } catch (error) {
    console.error('Error fetching position:', error);
    return NextResponse.json(
      { error: 'Failed to fetch position' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdatePositionData = await request.json();

    // Check if position exists
    const existingPosition = await prisma.position.findUnique({
      where: { id },
      include: {
        user: true
      }
    });

    if (!existingPosition) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    // Validate quantity if provided
    if (body.quantity !== undefined && body.quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      );
    }

    // Check if market exists (if provided)
    if (body.marketId) {
      const market = await prisma.market.findUnique({
        where: { id: body.marketId }
      });

      if (!market) {
        return NextResponse.json(
          { error: 'Market not found' },
          { status: 404 }
        );
      }
    }

    // Handle P&L changes with balance updates and transaction history
    let balanceChange = 0;
    let shouldCreateTransaction = false;

    if (body.pnl !== undefined && body.pnl !== existingPosition.pnl) {
      const oldPnl = existingPosition.pnl || 0;
      const newPnl = body.pnl || 0;
      balanceChange = newPnl - oldPnl;
      shouldCreateTransaction = true;
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update the position
      const updatedPosition = await tx.position.update({
        where: { id },
        data: {
          type: body.type,
          status: body.status,
          marketId: body.marketId,
          quantity: body.quantity,
          description: body.description,
          executedAt: body.executedAt,
          pnl: body.pnl
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              balance: true
            }
          },
          market: {
            select: {
              id: true,
              symbol: true,
              name: true,
              type: true
            }
          }
        }
      });

      // Update user balance and create transaction if P&L changed
      if (shouldCreateTransaction && balanceChange !== 0) {
        // Update user balance
        await tx.user.update({
          where: { id: existingPosition.userId },
          data: {
            balance: {
              increment: balanceChange
            }
          }
        });

        // Create transaction record for history
        await tx.transaction.create({
          data: {
            userId: existingPosition.userId,
            type: balanceChange > 0 ? 'GAIN' : 'LOSS',
            absoluteAmount: Math.abs(balanceChange),
            description: `Admin P&L adjustment for position ${id.slice(0, 8)}... - Balance ${balanceChange > 0 ? '+' : ''}${balanceChange.toFixed(2)}`
          }
        });
      }

      return updatedPosition;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating position:', error);
    return NextResponse.json(
      { error: 'Failed to update position' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if position exists
    const existingPosition = await prisma.position.findUnique({
      where: { id }
    });

    if (!existingPosition) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    await prisma.position.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Position deleted successfully' });
  } catch (error) {
    console.error('Error deleting position:', error);
    return NextResponse.json(
      { error: 'Failed to delete position' },
      { status: 500 }
    );
  }
}

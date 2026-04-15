import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Position } from '@/lib/prisma/generated/client';
import { getBalanceTypeForPositionRoom } from '@/lib/balance';

// Update position data type
type UpdatePositionData = Partial<Position>;

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
  } catch {
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

    const nextMarketId = body.marketId ?? existingPosition.marketId;
    const nextRoom = body.room ?? existingPosition.room;

    const marketForPosition = await prisma.market.findUnique({
      where: { id: nextMarketId }
    });

    if (!marketForPosition) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }

    if (marketForPosition.room !== nextRoom) {
      return NextResponse.json(
        {
          error: `Market ${marketForPosition.symbol} is in room ${marketForPosition.room}, but position room is ${nextRoom}`
        },
        { status: 400 }
      );
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
          room: body.room,
          marketId: body.marketId,
          quantity: body.quantity,
          executedPrice: body.executedPrice,
          closedPrice: body.closedPrice,
          takeProfit: body.takeProfit,
          stopLoss: body.stopLoss,
          description: body.description,
          executedAt: body.executedAt
            ? new Date(body.executedAt as string | Date)
            : body.executedAt,
          pnl: body.pnl
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
              type: true
            }
          }
        }
      });

      // Update user balance and create transaction if P&L changed
      if (shouldCreateTransaction && balanceChange !== 0) {
        const balanceType = getBalanceTypeForPositionRoom(
          updatedPosition.room ?? existingPosition.room
        );

        // Update user balance
        const balanceRow = await tx.userBalance.upsert({
          where: {
            userId_type: { userId: existingPosition.userId, type: balanceType }
          },
          update: { amount: { increment: balanceChange } },
          create: {
            userId: existingPosition.userId,
            type: balanceType,
            amount: balanceChange
          }
        });

        // Create transaction record for history
        await tx.transaction.create({
          data: {
            userBalanceId: balanceRow.id,
            type: balanceChange > 0 ? 'GAIN' : 'LOSS',
            absoluteAmount: Math.abs(balanceChange),
            description: `Admin P&L adjustment for position ${id.slice(0, 8)}... - Balance ${balanceChange > 0 ? '+' : ''}${balanceChange.toFixed(2)}`
          }
        });
      }

      return updatedPosition;
    });

    return NextResponse.json(result);
  } catch {
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
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete position' },
      { status: 500 }
    );
  }
}

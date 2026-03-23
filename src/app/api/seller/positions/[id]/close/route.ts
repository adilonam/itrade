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

// Helper function to check seller permissions
async function checkSellerPermission(session: any) {
  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, id: true }
  });

  if (
    !user ||
    (user.role !== 'SELLER' &&
      user.role !== 'ADMIN' &&
      user.role !== 'SUPERADMIN')
  ) {
    return { error: 'Forbidden - insufficient permissions', status: 403 };
  }

  return { user, status: 200 };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const permissionCheck = await checkSellerPermission(session);

    if (permissionCheck.error) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status = 'CLOSED' } = body;

    if (status !== 'CLOSED') {
      return NextResponse.json(
        { error: 'Invalid status. Must be CLOSED' },
        { status: 400 }
      );
    }

    const sellerId = session?.user.id;
    if (!sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the position and verify it belongs to a user linked to this seller
    const existingPosition = await prisma.position.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            sellerId: true
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

    // Check if user is linked to this seller
    if (existingPosition.user.sellerId !== sellerId) {
      return NextResponse.json(
        {
          error:
            'Forbidden - position does not belong to a user linked to this seller'
        },
        { status: 403 }
      );
    }

    // Check if position can be closed
    if (['CLOSED'].includes(existingPosition.status)) {
      return NextResponse.json(
        { error: 'Position is already closed' },
        { status: 400 }
      );
    }

    // Get current market price
    await refreshSaveMarkets([existingPosition.market]);
    const currentPrice = existingPosition.market.lastPrice;

    // Calculate P&L
    const positionWithClosedPrice = {
      ...existingPosition,
      closedPrice: currentPrice,
      status: 'CLOSED' as const
    };

    const calculatedPnL = await calculatePositionPnL(
      positionWithClosedPrice as Position & {
        market: Market;
      }
    );

    // Close the position in a transaction
    const closedPosition = await prisma.$transaction(async (tx) => {
      // Update the position
      const updated = await tx.position.update({
        where: { id },
        data: {
          status: 'CLOSED',
          closedPrice: currentPrice,
          closedAt: new Date(),
          pnl: calculatedPnL || 0
        },
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

      // Update user balance and create transaction if P&L is calculated
      if (calculatedPnL !== null && calculatedPnL !== 0) {
        const transactionType: TransactionType =
          calculatedPnL > 0 ? 'GAIN' : 'LOSS';
        const absoluteAmount = Math.abs(calculatedPnL);

        // Update user balance
        await tx.userBalance.upsert({
          where: { userId_type: { userId: existingPosition.userId, type: 'REAL' } },
          update: { amount: { increment: calculatedPnL } },
          create: { userId: existingPosition.userId, type: 'REAL', amount: calculatedPnL }
        });

        // Create transaction record
        await tx.transaction.create({
          data: {
            userId: existingPosition.userId,
            balanceType: 'REAL',
            type: transactionType,
            absoluteAmount: absoluteAmount,
            description: `Position ${existingPosition.type} closed - ${existingPosition.market?.symbol || 'Unknown'}`
          }
        });
      }

      return updated;
    });

    return NextResponse.json({
      position: closedPosition,
      message: 'Position closed successfully'
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculatePositionPnL } from '@/lib/calculator-server';
import { requireAdminSession } from '@/lib/admin-auth';
import {
  applyAdminPositionBalanceAdjustment,
  computeAdminPositionBalanceAdjustment
} from '@/lib/admin-position-balance';
import type { Market, Position, PositionStatus } from '@/lib/prisma/generated/client';

type UpdatePositionData = Partial<Position>;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

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
        },
        userBalance: true
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
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body: UpdatePositionData = await request.json();

    const existingPosition = await prisma.position.findUnique({
      where: { id },
      include: {
        user: true,
        market: true
      }
    });

    if (!existingPosition) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

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

    const nextStatus = (body.status ?? existingPosition.status) as PositionStatus;
    const resolvedClosedAt =
      body.closedAt !== undefined
        ? body.closedAt === null
          ? null
          : new Date(body.closedAt as string | Date)
        : undefined;
    const closedAt =
      body.status !== undefined || body.closedAt !== undefined
        ? nextStatus === 'CLOSED'
          ? resolvedClosedAt !== undefined &&
            resolvedClosedAt !== null &&
            !Number.isNaN(resolvedClosedAt.getTime())
            ? resolvedClosedAt
            : new Date()
          : null
        : undefined;

    let resolvedPnl =
      body.pnl !== undefined ? body.pnl : existingPosition.pnl;

    if (
      nextStatus === 'CLOSED' &&
      existingPosition.status !== 'CLOSED' &&
      (resolvedPnl === null || resolvedPnl === undefined) &&
      existingPosition.market
    ) {
      const closedPrice =
        body.closedPrice ??
        existingPosition.closedPrice ??
        existingPosition.market.lastPrice ??
        null;

      const calculated = await calculatePositionPnL({
        ...existingPosition,
        ...body,
        status: 'CLOSED',
        closedPrice,
        market: existingPosition.market as Market
      } as Position & { market: Market });

      if (calculated !== null) {
        resolvedPnl = calculated;
      }
    }

    const balanceAdjustment = computeAdminPositionBalanceAdjustment({
      oldStatus: existingPosition.status,
      newStatus: nextStatus,
      oldPnl: existingPosition.pnl,
      newPnl: resolvedPnl ?? null,
      positionId: id,
      marketSymbol: existingPosition.market?.symbol
    });

    const result = await prisma.$transaction(async (tx) => {
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
          closedAt,
          takeProfit: body.takeProfit,
          stopLoss: body.stopLoss,
          description: body.description,
          executedAt: body.executedAt
            ? new Date(body.executedAt as string | Date)
            : body.executedAt,
          pnl:
            body.pnl !== undefined
              ? body.pnl
              : nextStatus === 'CLOSED' &&
                  existingPosition.status !== 'CLOSED' &&
                  resolvedPnl !== null &&
                  resolvedPnl !== undefined
                ? resolvedPnl
                : undefined
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
          },
          userBalance: true
        }
      });

      if (balanceAdjustment) {
        await applyAdminPositionBalanceAdjustment(
          tx,
          existingPosition.userBalanceId,
          balanceAdjustment
        );
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
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
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

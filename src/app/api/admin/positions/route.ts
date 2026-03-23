import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculatePositionPnL } from '@/lib/calculator-server';
import type { Market, Position, PositionType, PositionStatus, Room } from '@/lib/prisma/generated/client';

type CreatePositionBody = {
  userId: string;
  type: PositionType;
  status?: PositionStatus;
  room: Room;
  marketId: string;
  quantity: number;
  executedPrice: number;
  closedPrice?: number | null;
  description?: string | null;
  executedAt?: string | Date | null;
  pnl?: number | null;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const room = searchParams.get('room');
    const marketId = searchParams.get('marketId');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (status) where.status = status;
    if (room) where.room = room;
    if (marketId) where.marketId = marketId;

    // Enhanced search functionality - search across multiple fields
    if (search) {
      where.OR = [
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          user: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          user: {
            email: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          market: {
            symbol: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          market: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          id: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    const [positions, total] = await Promise.all([
      prisma.position.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          market: true
        },
        orderBy: {
          executedAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.position.count({ where })
    ]);

    // Calculate PnL for PLACED positions only
    const positionsWithPnL = await Promise.all(
      positions.map(async (position) => {
        if (position.status === 'PLACED') {
          const calculatedPnL = await calculatePositionPnL(
            position as Position & {
              market: Market;
            }
          );
          return {
            ...position,
            calculatedPnL
          };
        }
        return {
          ...position,
          calculatedPnL: null
        };
      })
    );

    return NextResponse.json({
      positions: positionsWithPnL,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreatePositionBody;

    // Validate required fields
    if (
      !body.userId ||
      !body.type ||
      body.quantity === undefined ||
      !body.marketId ||
      !body.room
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: userId, type, quantity, marketId, room'
        },
        { status: 400 }
      );
    }

    // Validate quantity
    if (body.quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: body.userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const executedPrice = body.executedPrice;
    if (executedPrice === undefined || executedPrice === null) {
      return NextResponse.json(
        { error: 'Executed price is required' },
        { status: 400 }
      );
    }

    const market = await prisma.market.findUnique({
      where: { id: body.marketId }
    });

    if (!market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }

    if (market.room !== body.room) {
      return NextResponse.json(
        {
          error: `Selected market belongs to room ${market.room}, but position room is ${body.room}`
        },
        { status: 400 }
      );
    }

    const position = await prisma.position.create({
      data: {
        userId: body.userId,
        type: body.type,
        status: body.status || 'PLACED',
        room: body.room,
        marketId: body.marketId,
        quantity: body.quantity,
        executedPrice,
        closedPrice: body.closedPrice,
        description: body.description,
        executedAt: body.executedAt
          ? new Date(body.executedAt)
          : undefined,
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
        market: true
      }
    });

    // Calculate PnL for PLACED positions only
    let calculatedPnL = null;
    if (position.status === 'PLACED') {
      calculatedPnL = await calculatePositionPnL(
        position as Position & {
          market: Market;
        }
      );
    }

    const response = {
      ...position,
      calculatedPnL
    };

    return NextResponse.json(response, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create position' },
      { status: 500 }
    );
  }
}

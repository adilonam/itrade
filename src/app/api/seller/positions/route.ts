import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getAuthSession } from '@/lib/auth';
import {
  refreshSaveMarkets,
  calculatePositionPnL
} from '@/lib/calculator-server';
import { Market, Position } from '@/lib/prisma/generated/client';
import { resolveUserBalanceForNewPosition } from '@/lib/balance';

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

// Validation schema
const getSellerPositionsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  room: z.enum(['TRADING', 'STOCK']).optional(),
  userId: z.string().optional(),
  status: z.enum(['PLACED', 'CLOSED', 'PENDING', 'FAILED']).optional()
});

// GET - Get positions of seller's linked users
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const permissionCheck = await checkSellerPermission(session);

    if (permissionCheck.error) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const validation = getSellerPositionsSchema.safeParse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      room: searchParams.get('room') || undefined,
      userId: searchParams.get('userId') || undefined,
      status: searchParams.get('status') || undefined
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { page, limit, room, userId, status } = validation.data;
    const skip = (page - 1) * limit;

    // Get seller's ID
    const sellerId = session?.user.id;
    if (!sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build where clause - positions of users linked to this seller
    const where: any = {
      user: {
        sellerId: sellerId
      }
    };

    if (room) where.room = room;
    if (userId) where.userId = userId;
    if (status) where.status = status;

    // Get positions with user and market info
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

    // Calculate PnL for PLACED positions
    const positionsWithPnL = await Promise.all(
      positions.map(async (position) => {
        if (position.status === 'PLACED') {
          try {
            await refreshSaveMarkets([position.market]);
            const pnl = await calculatePositionPnL(
              position as Position & {
                market: Market;
              }
            );
            return {
              ...position,
              calculatedPnL: pnl
            };
          } catch {
            return position;
          }
        }
        return position;
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

const createPositionSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(['BUY', 'SELL']),
  quantity: z.number().min(0.0001),
  marketId: z.string().min(1),
  room: z.enum(['TRADING', 'STOCK']),
  executedPrice: z.number().optional(),
  takeProfit: z.number().optional(),
  stopLoss: z.number().optional(),
  description: z.string().optional(),
  status: z.enum(['PLACED', 'PENDING']).optional().default('PLACED'),
  userBalanceId: z.string().optional(),
  balanceType: z.enum(['REAL', 'DEMO']).optional()
});

// POST - Create position for a linked user
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const permissionCheck = await checkSellerPermission(session);

    if (permissionCheck.error) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const body = await request.json();
    const validation = createPositionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const {
      userId,
      type,
      quantity,
      marketId,
      room,
      executedPrice,
      takeProfit,
      stopLoss,
      description,
      status,
      userBalanceId,
      balanceType
    } = validation.data;

    const sellerId = session?.user.id;
    if (!sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is linked to this seller
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, sellerId: true }
    });

    if (!user || user.sellerId !== sellerId) {
      return NextResponse.json(
        { error: 'User is not linked to this seller' },
        { status: 403 }
      );
    }

    // Get market to get current price if executedPrice not provided
    const market = await prisma.market.findUnique({
      where: { id: marketId }
    });

    if (!market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }

    const finalExecutedPrice =
      executedPrice || (status === 'PLACED' ? market.lastPrice : null);

    const walletResult = await prisma.$transaction((tx) =>
      resolveUserBalanceForNewPosition(tx, userId, {
        userBalanceId,
        room,
        balanceType
      })
    );

    if (!walletResult.ok) {
      return NextResponse.json(
        { error: 'Invalid userBalanceId for this user' },
        { status: 400 }
      );
    }

    // Create position
    const position = await prisma.position.create({
      data: {
        userId,
        type,
        status: status || 'PLACED',
        room,
        userBalanceId: walletResult.id,
        marketId,
        quantity,
        executedPrice: finalExecutedPrice,
        takeProfit: takeProfit || null,
        stopLoss: stopLoss || null,
        description:
          description ||
          `${type} ${quantity} lots of ${market.symbol} (${room} room)`,
        executedAt: status === 'PLACED' ? new Date() : null
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

    return NextResponse.json(
      {
        position,
        message: 'Position created successfully'
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

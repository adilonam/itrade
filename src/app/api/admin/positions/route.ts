import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculatePositionPnL } from '@/lib/pnl-calculator';
import { Market, Position } from '@prisma/client';

// Create position data type
type CreatePositionData = Position;

/**
 * @swagger
 * /api/admin/positions:
 *   get:
 *     summary: Get all positions with filtering and pagination
 *     tags: [Admin, Positions]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of positions per page
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [BUY, SELL, DEPOSIT, WITHDRAWAL, TRANSFER_IN, TRANSFER_OUT, FEE, BONUS, REFUND]
 *         description: Filter by position type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PLACED, CLOSED, FAILED, PENDING]
 *         description: Filter by position status
 *       - in: query
 *         name: marketId
 *         schema:
 *           type: string
 *         description: Filter by market ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in description
 *     responses:
 *       200:
 *         description: List of positions with calculated PnL for PLACED BUY/SELL positions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 positions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                       status:
 *                         type: string
 *                       quantity:
 *                         type: number
 *                       pnl:
 *                         type: number
 *                         nullable: true
 *                         description: Stored PnL value
 *                       calculatedPnL:
 *                         type: number
 *                         nullable: true
 *                         description: Real-time calculated PnL for PLACED BUY/SELL positions based on current market price
 *                       market:
 *                         type: object
 *                         properties:
 *                           symbol:
 *                             type: string
 *                           name:
 *                             type: string
 *                           type:
 *                             type: string
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     total:
 *                       type: number
 *                     pages:
 *                       type: number
 *   post:
 *     summary: Create a new position
 *     tags: [Admin, Positions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, type, quantity]
 *             properties:
 *               userId:
 *                 type: string
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
 *       201:
 *         description: Position created successfully with calculated PnL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 type:
 *                   type: string
 *                 status:
 *                   type: string
 *                 quantity:
 *                   type: number
 *                 pnl:
 *                   type: number
 *                   nullable: true
 *                   description: Stored PnL value
 *                 calculatedPnL:
 *                   type: number
 *                   nullable: true
 *                   description: Real-time calculated PnL for PLACED BUY/SELL positions based on current market price
 *                 market:
 *                   type: object
 *                   properties:
 *                     symbol:
 *                       type: string
 *                     name:
 *                       type: string
 *                     type:
 *                       type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const marketId = searchParams.get('marketId');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (status) where.status = status;
    if (marketId) where.marketId = marketId;
    if (search) {
      where.description = {
        contains: search,
        mode: 'insensitive'
      };
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
  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePositionData = await request.json();

    // Validate required fields
    if (!body.userId || !body.type || body.quantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, quantity' },
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

    // Check if market exists and fetch executed price for BUY/SELL positions
    let executedPrice = body.executedPrice;
    if (!executedPrice) {
      return NextResponse.json(
        { error: 'Executed price is required' },
        { status: 400 }
      );
    }
    let market = null;

    if (body.marketId) {
      market = await prisma.market.findUnique({
        where: { id: body.marketId }
      });

      if (!market) {
        return NextResponse.json(
          { error: 'Market not found' },
          { status: 404 }
        );
      }
    }

    const position = await prisma.position.create({
      data: {
        userId: body.userId,
        type: body.type,
        status: body.status || 'PLACED',
        marketId: body.marketId,
        quantity: body.quantity,
        executedPrice: executedPrice ?? undefined,
        closedPrice: body.closedPrice,
        description: body.description,
        executedAt: body.executedAt,
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
  } catch (error) {
    console.error('Error creating position:', error);
    return NextResponse.json(
      { error: 'Failed to create position' },
      { status: 500 }
    );
  }
}

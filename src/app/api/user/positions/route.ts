import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  refreshSaveMarkets,
  calculatePositionPnL,
  calculateRequiredMargin,
  couldOpenPosition
} from '@/lib/calculator-server';
// Create position data type
type CreatePositionData = Position;
import { Market, Position } from '@prisma/client';

/**
 * @swagger
 * /api/user/positions:
 *   get:
 *     summary: Get current user's positions with filtering and pagination
 *     tags: [User, Positions]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [BUY, SELL, DEPOSIT, WITHDRAWAL, TRANSFER_IN, TRANSFER_OUT, FEE, BONUS, REFUND]
 *         description: Filter by position type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED, CANCELLED, PENDING]
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
 *       - in: query
 *         name: room
 *         schema:
 *           type: string
 *           enum: [STOCK, TRADING, STOCK_AND_TRADING]
 *         description: Filter by room type
 *     responses:
 *       200:
 *         description: List of user's positions with calculated PnL
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
 *                         description: Stored PnL value (automatically calculated and saved)
 *                       calculatedPnL:
 *                         type: number
 *                         nullable: true
 *                         description: Real-time calculated PnL for PLACED BUY/SELL positions based on current market price
 *                       requiredMargin:
 *                         type: number
 *                         nullable: true
 *                         description: Required margin for the position (calculated for PLACED positions)
 *                       market:
 *                         type: object
 *                         properties:
 *                           symbol:
 *                             type: string
 *                           name:
 *                             type: string
 *                           type:
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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new position for current user
 *     tags: [User, Positions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, quantity]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [BUY, SELL, DEPOSIT, WITHDRAWAL, TRANSFER_IN, TRANSFER_OUT, FEE, BONUS, REFUND]
 *               status:
 *                 type: string
 *                 enum: [PLACED, CLOSED, FAILED, PENDING]
 *               room:
 *                 type: string
 *                 enum: [STOCK, TRADING, STOCK_AND_TRADING]
 *                 description: Room type (defaults to TRADING)
 *               marketId:
 *                 type: string
 *               quantity:
 *                 type: number
 *               description:
 *                 type: string
 *               executedAt:
 *                 type: string
 *                 format: date-time
 *               executedPrice:
 *                 type: number
 *                 description: Executed price (required for PENDING status)
 *               takeProfit:
 *                 type: number
 *                 description: Take profit price level
 *               stopLoss:
 *                 type: number
 *                 description: Stop loss price level
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
 *                   description: Stored PnL value (automatically calculated and saved)
 *                 calculatedPnL:
 *                   type: number
 *                   nullable: true
 *                   description: Real-time calculated PnL for PLACED BUY/SELL positions based on current market price
 *                 requiredMargin:
 *                   type: number
 *                   nullable: true
 *                   description: Required margin for the position (calculated for PLACED positions)
 *                 market:
 *                   type: object
 *                   properties:
 *                     symbol:
 *                       type: string
 *                     name:
 *                       type: string
 *                     type:
 *                       type: string
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const marketId = searchParams.get('marketId');
    const search = searchParams.get('search');
    const room = searchParams.get('room');

    const skip = (page - 1) * limit;

    // Build where clause - only show current user's positions
    const where: any = {
      userId: session.user.id
    };

    if (type) where.type = type;
    if (status) where.status = status;
    if (marketId) where.marketId = marketId;
    if (room) where.room = room;
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
          const pnl = await calculatePositionPnL(
            position as Position & {
              market: Market;
            }
          );

          return {
            ...position,
            pnl
          };
        }
        return {
          ...position
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
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: Omit<CreatePositionData, 'userId'> = await request.json();

    // Validate required fields
    if (!body.type || body.quantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: type, quantity' },
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

    // Get user data including balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { balance: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if market exists and handle executed price logic
    let executedPrice = null;
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

      // Handle executed price based on status and order type
      if (body.status === 'PENDING' && body.executedPrice) {
        // For PENDING orders, use provided executedPrice
        executedPrice = body.executedPrice;

        // Refresh market data and validate executed price against current market price
        const refreshedMarkets = await refreshSaveMarkets([market]);
        if (!refreshedMarkets || refreshedMarkets.length === 0) {
          return NextResponse.json(
            { error: 'Unable to refresh market data for validation' },
            { status: 500 }
          );
        }
        const currentPrice = market.lastPrice; // Use the market's lastPrice since getCombinedData stores data

        // Validate executed price based on order type
        if (body.type === 'BUY' && executedPrice >= currentPrice) {
          return NextResponse.json(
            {
              error:
                'For BUY orders, executed price must be lower than current market price'
            },
            { status: 400 }
          );
        }

        if (body.type === 'SELL' && executedPrice <= currentPrice) {
          return NextResponse.json(
            {
              error:
                'For SELL orders, executed price must be higher than current market price'
            },
            { status: 400 }
          );
        }
      } else {
        // For PLACED orders or when no executedPrice provided, refresh market and use current price
        const refreshedMarkets = await refreshSaveMarkets([market]);
        if (!refreshedMarkets || refreshedMarkets.length === 0) {
          return NextResponse.json(
            { error: 'Unable to refresh market data' },
            { status: 500 }
          );
        }
        executedPrice = market.lastPrice; // Use the market's lastPrice since getCombinedData stores data
      }

      // Validate user has sufficient balance for STOCK room only
      const isStockRoom =
        body.room === 'STOCK' || body.room === 'STOCK_AND_TRADING';

      if (isStockRoom) {
        // Validate user has sufficient balance for BUY orders
        if (body.type === 'BUY' && executedPrice) {
          const totalCost = body.quantity * executedPrice;

          if (user.balance < totalCost) {
            return NextResponse.json(
              {
                error: 'Insufficient balance',
                message: `You need $${totalCost.toFixed(2)} but only have $${user.balance.toFixed(2)}. Please add funds to your account.`,
                requiredBalance: totalCost,
                currentBalance: user.balance
              },
              { status: 400 }
            );
          }
        }

        // Validate user has sufficient balance for SELL orders
        if (body.type === 'SELL' && executedPrice) {
          // For SELL orders, user needs margin to cover potential losses
          // Calculate required margin based on quantity and price
          // Use stop loss if provided, otherwise require full position value as margin
          let requiredMargin: number;

          if (body.stopLoss && body.stopLoss > executedPrice) {
            // If stop loss is set, calculate maximum potential loss
            const maxLoss = (body.stopLoss - executedPrice) * body.quantity;
            requiredMargin = maxLoss;
          } else {
            // Without stop loss, require the full position value as margin
            requiredMargin = body.quantity * executedPrice;
          }

          if (user.balance < requiredMargin) {
            return NextResponse.json(
              {
                error: 'Insufficient balance',
                message: `You need $${requiredMargin.toFixed(2)} margin but only have $${user.balance.toFixed(2)}. Please add funds to your account or set a stop loss.`,
                requiredBalance: requiredMargin,
                currentBalance: user.balance
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // Validate take profit and stop loss if provided
    if (body.takeProfit !== undefined || body.stopLoss !== undefined) {
      if (body.marketId && market && executedPrice) {
        // Use executedPrice as the reference price for validation
        const referencePrice = executedPrice;
        // Validate take profit
        if (body.takeProfit !== undefined && body.takeProfit !== null) {
          if (body.takeProfit <= 0) {
            return NextResponse.json(
              { error: 'Take profit must be greater than 0' },
              { status: 400 }
            );
          }

          if (body.type === 'BUY' && body.takeProfit <= referencePrice) {
            return NextResponse.json(
              {
                error:
                  'For BUY orders, take profit must be higher than executed price'
              },
              { status: 400 }
            );
          }

          if (body.type === 'SELL' && body.takeProfit >= referencePrice) {
            return NextResponse.json(
              {
                error:
                  'For SELL orders, take profit must be lower than executed price'
              },
              { status: 400 }
            );
          }
        }

        // Validate stop loss
        if (body.stopLoss !== undefined && body.stopLoss !== null) {
          if (body.stopLoss <= 0) {
            return NextResponse.json(
              { error: 'Stop loss must be greater than 0' },
              { status: 400 }
            );
          }

          if (body.type === 'BUY' && body.stopLoss >= referencePrice) {
            return NextResponse.json(
              {
                error:
                  'For BUY orders, stop loss must be lower than executed price'
              },
              { status: 400 }
            );
          }

          if (body.type === 'SELL' && body.stopLoss <= referencePrice) {
            return NextResponse.json(
              {
                error:
                  'For SELL orders, stop loss must be higher than executed price'
              },
              { status: 400 }
            );
          }
        }

        // Validate take profit vs stop loss relationship
        if (
          body.takeProfit !== undefined &&
          body.stopLoss !== undefined &&
          body.takeProfit !== null &&
          body.stopLoss !== null
        ) {
          if (body.type === 'BUY' && body.takeProfit <= body.stopLoss) {
            return NextResponse.json(
              {
                error:
                  'For BUY orders, take profit must be higher than stop loss'
              },
              { status: 400 }
            );
          }

          if (body.type === 'SELL' && body.takeProfit >= body.stopLoss) {
            return NextResponse.json(
              {
                error:
                  'For SELL orders, take profit must be lower than stop loss'
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // Calculate required margin for PLACED positions
    let requiredMargin = null;
    if (
      (body.status || 'PENDING') === 'PLACED' &&
      body.marketId &&
      executedPrice
    ) {
      // Get user with all necessary information for margin calculation and position check
      const userWithLeverage = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          balance: true,
          leverage: true
        }
      });

      if (userWithLeverage) {
        // Create a temporary position object for margin calculation and position check
        const tempPosition = {
          id: 'temp',
          userId: session.user.id,
          type: body.type,
          status: 'PLACED' as const,
          room: body.room || 'TRADING',
          marketId: body.marketId,
          quantity: body.quantity,
          executedPrice: executedPrice,
          closedPrice: null,
          takeProfit: body.takeProfit,
          stopLoss: body.stopLoss,
          description: body.description,
          executedAt: body.executedAt || new Date(),
          closedAt: null,
          pnl: null,
          user: userWithLeverage,
          market: market
        };

        // Check if user can open this position
        const positionCheck = await couldOpenPosition(tempPosition as any);
        console.log('positionCheck', positionCheck);

        if (!positionCheck || !positionCheck.canOpen) {
          // User cannot open position, create with FAILED status
          const failedPosition = await prisma.position.create({
            data: {
              userId: session.user.id,
              type: body.type,
              status: 'FAILED',
              room: body.room || 'TRADING',
              marketId: body.marketId,
              quantity: body.quantity,
              executedPrice: executedPrice ?? undefined,
              closedPrice: body.closedPrice,
              takeProfit: body.takeProfit,
              stopLoss: body.stopLoss,
              requiredMargin: positionCheck?.newPositionRequiredMargin || 0,
              description:
                body.description ||
                'Position failed due to insufficient margin',
              executedAt: body.executedAt || new Date(),
              pnl: body.pnl
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  leverage: true
                }
              },
              market: true
            }
          });

          return NextResponse.json(
            {
              success: false,
              message: 'Position creation failed due to insufficient margin',
              position: failedPosition,
              marginInfo: positionCheck
            },
            { status: 400 }
          );
        }

        // User can open position, use the required margin from position check
        requiredMargin = positionCheck.newPositionRequiredMargin;
      }
    }

    const position = await prisma.position.create({
      data: {
        userId: session.user.id,
        type: body.type,
        status: body.status || 'PENDING',
        room: body.room || 'TRADING',
        marketId: body.marketId,
        quantity: body.quantity,
        executedPrice: executedPrice ?? undefined,
        closedPrice: body.closedPrice,
        takeProfit: body.takeProfit,
        stopLoss: body.stopLoss,
        requiredMargin: requiredMargin,
        description: body.description,
        executedAt: body.executedAt || new Date(),
        pnl: body.pnl
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            leverage: true
          }
        },
        market: true
      }
    });

    // Update user balance for STOCK room positions
    const isStockRoom =
      body.room === 'STOCK' || body.room === 'STOCK_AND_TRADING';
    if (isStockRoom && executedPrice) {
      let balanceChange = 0;

      if (body.type === 'BUY') {
        // Deduct cost for BUY orders
        balanceChange = -(body.quantity * executedPrice);
      } else if (body.type === 'SELL') {
        // Deduct margin for SELL orders
        if (body.stopLoss && body.stopLoss > executedPrice) {
          balanceChange = -((body.stopLoss - executedPrice) * body.quantity);
        } else {
          balanceChange = -(body.quantity * executedPrice);
        }
      }

      // Update user balance
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          balance: {
            increment: balanceChange
          }
        }
      });
    }

    // Calculate PnL for PLACED positions only
    let pnl = null;
    if (position.status === 'PLACED') {
      pnl = await calculatePositionPnL(
        position as Position & {
          market: Market;
        }
      );
    }

    const response = {
      ...position,
      pnl
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Position creation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create position',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

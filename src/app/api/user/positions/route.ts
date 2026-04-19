import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import {
  refreshSaveMarkets,
  calculatePositionPnL,
  couldOpenPosition
} from '@/lib/calculator-server';
import {
  getUserBalanceAmount,
  resolveUserBalanceForNewPosition
} from '@/lib/balance';
// Create position data type
type CreatePositionData = Position;
import { Market, Position } from '@/lib/prisma/generated/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();

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
    if (status) {
      const statuses = status.split(',').map((s) => s.trim()).filter(Boolean);
      if (statuses.length === 1) {
        where.status = statuses[0];
      } else if (statuses.length > 1) {
        where.status = { in: statuses };
      }
    }
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
          market: true,
          userBalance: true
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
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = session.user.role as string;
    const canBypass = role === 'ADMIN' || role === 'SUPERADMIN';
    if (!canBypass) {
      const appSettings = await prisma.appSettings.findUnique({
        where: { id: 'default' }
      });
      if ((appSettings?.openMarket ?? true) === false) {
        return NextResponse.json(
          {
            error:
              'Market is currently closed. Position creation is disabled by administrators.'
          },
          { status: 403 }
        );
      }
    }

    const body: Omit<CreatePositionData, 'userId'> & {
      balanceType?: unknown;
      userBalanceId?: string | null;
    } = await request.json();

    const positionRoom = (body.room as string | undefined) ?? 'TRADING';
    if (positionRoom === 'INSTITUTIONAL' && !canBypass) {
      return NextResponse.json(
        {
          error: 'Only administrators can open institutional positions.',
          message: 'Only administrators can open institutional positions.'
        },
        { status: 403 }
      );
    }

    const walletResult = await prisma.$transaction((tx) =>
      resolveUserBalanceForNewPosition(tx, session.user.id, {
        userBalanceId: body.userBalanceId,
        room: body.room ?? undefined,
        balanceType: body.balanceType
      })
    );

    if (!walletResult.ok) {
      return NextResponse.json(
        { error: 'Invalid userBalanceId for your account' },
        { status: 400 }
      );
    }

    const positionUserBalanceId = walletResult.id;
    const balanceType = walletResult.type;

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
      select: { id: true }
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
        // For PLACED orders or when no executedPrice provided, refresh market and use current price with spread
        const refreshedMarkets = await refreshSaveMarkets([market]);
        if (!refreshedMarkets || refreshedMarkets.length === 0) {
          return NextResponse.json(
            { error: 'Unable to refresh market data' },
            { status: 500 }
          );
        }
        const refreshedMarket = refreshedMarkets[0];
        const midPrice = refreshedMarket.lastPrice ?? 0;
        const spread = refreshedMarket.spread ?? 0;
        const bidPrice = midPrice - spread / 2;
        const askPrice = midPrice + spread / 2;
        // BUY fills at ask, SELL fills at bid
        executedPrice =
          body.type === 'BUY' ? askPrice : bidPrice;
      }

      // Balance validation is handled by couldOpenPosition function for both STOCK and TRADING rooms
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
          leverage: true
        }
      });

      if (userWithLeverage) {
        const balance = await prisma.$transaction((tx) =>
          getUserBalanceAmount(tx, session.user.id, balanceType)
        );
        // Create a temporary position object for margin calculation and position check
        const tempPosition = {
          id: 'temp',
          userId: session.user.id,
          type: body.type,
          status: 'PLACED' as const,
          room: body.room || 'TRADING',
          userBalanceId: positionUserBalanceId,
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
          user: {
            ...userWithLeverage,
            balance
          },
          market: market
        };

        // Check if user can open this position
        const positionCheck = await couldOpenPosition(tempPosition as any);

        if (!positionCheck || !positionCheck.canOpen) {
          // User cannot open position, create with FAILED status
          const failedPosition = await prisma.position.create({
            data: {
              userId: session.user.id,
              type: body.type,
              status: 'FAILED',
              room: body.room || 'TRADING',
              userBalanceId: positionUserBalanceId,
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
              market: true,
              userBalance: true
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
        userBalanceId: positionUserBalanceId,
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
        market: true,
        userBalance: true
      }
    });

    // No balance update needed - margin is already calculated and reserved by couldOpenPosition
    // STOCK room: leverage = 1, TRADING room: leverage = user.leverage

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

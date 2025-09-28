import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { twelveDataService } from '@/lib/twelvedata';
import { z } from 'zod';

/**
 * @swagger
 * /api/admin/markets:
 *   get:
 *     tags:
 *       - Admin - Markets
 *     summary: Get all markets for admin management
 *     description: Retrieve a list of all markets with pagination and filtering. Requires ADMIN or SUPERADMIN role.
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of markets per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by symbol or name
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [FOREX, CRYPTO, STOCKS, COMMODITIES, INDICES]
 *         description: Filter by market type
 *       - in: query
 *         name: visible
 *         schema:
 *           type: boolean
 *         description: Filter by visibility status
 *     responses:
 *       200:
 *         description: Successfully retrieved markets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 markets:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [FOREX, CRYPTO, STOCKS, COMMODITIES, INDICES]
 *                       symbol:
 *                         type: string
 *                       name:
 *                         type: string
 *                       spread:
 *                         type: number
 *                       lastPrice:
 *                         type: number
 *                       lastChange:
 *                         type: number
 *                       visible:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires admin role
 *       500:
 *         description: Internal server error
 *   post:
 *     tags:
 *       - Admin - Markets
 *     summary: Create a new market
 *     description: Create a new market after validating it exists on TwelveData API. Requires ADMIN or SUPERADMIN role.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - symbol
 *               - type
 *             properties:
 *               symbol:
 *                 type: string
 *                 example: "EURUSD"
 *                 description: Market symbol
 *               type:
 *                 type: string
 *                 enum: [FOREX, CRYPTO, STOCKS, COMMODITIES, INDICES]
 *                 example: "FOREX"
 *               spread:
 *                 type: number
 *                 example: 0.00002
 *                 description: Market spread (optional, defaults to 0)
 *               visible:
 *                 type: boolean
 *                 example: true
 *                 description: Market visibility (optional, defaults to true)
 *     responses:
 *       201:
 *         description: Market created successfully
 *       400:
 *         description: Invalid request data or market validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires admin role
 *       409:
 *         description: Market already exists
 *       500:
 *         description: Internal server error
 */

const createMarketSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').max(12, 'Symbol too long'),
  type: z.enum(['FOREX', 'CRYPTO', 'STOCKS', 'COMMODITIES', 'INDICES']),
  spread: z.number().min(0).optional(),
  visible: z.boolean().optional()
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const visibleParam = searchParams.get('visible');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { symbol: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (
      type &&
      ['FOREX', 'CRYPTO', 'STOCKS', 'COMMODITIES', 'INDICES'].includes(type)
    ) {
      where.type = type;
    }

    if (visibleParam !== null) {
      where.visible = visibleParam === 'true';
    }

    // Get markets with pagination
    const [markets, total] = await Promise.all([
      prisma.market.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.market.count({ where })
    ]);

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      markets,
      pagination: {
        total,
        pages,
        page,
        limit
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate request body
    const validation = createMarketSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    const { symbol, type, spread = 0, visible = true } = validation.data;
    const upperSymbol = symbol.toUpperCase();

    // Check if market already exists
    const existingMarket = await prisma.market.findUnique({
      where: { symbol: upperSymbol }
    });

    if (existingMarket) {
      return NextResponse.json(
        { error: 'Market already exists' },
        { status: 409 }
      );
    }

    // Validate symbol exists on TwelveData
    const marketData = await twelveDataService.getCombinedData(upperSymbol);

    if ('error' in marketData) {
      return NextResponse.json(
        {
          error: 'Market validation failed',
          message: `Symbol "${upperSymbol}" not found on TwelveData API`
        },
        { status: 400 }
      );
    }

    // Extract market name from TwelveData response
    const marketName = marketData.name || upperSymbol;
    const lastPrice = parseFloat(
      marketData.current_price || marketData.close || '0'
    );
    const lastChange = parseFloat(marketData.change || '0');

    // Create the market
    const newMarket = await prisma.market.create({
      data: {
        symbol: upperSymbol,
        name: marketName,
        type,
        spread,
        visible,
        lastPrice: isFinite(lastPrice) ? lastPrice : 0,
        lastChange: isFinite(lastChange) ? lastChange : 0
      }
    });

    return NextResponse.json(newMarket, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

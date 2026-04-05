import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { twelveDataService } from '@/lib/twelvedata';
import { z } from 'zod';
import { getAuthSession } from '@/lib/auth';

const createMarketSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').max(12, 'Symbol too long'),
  type: z.enum(['FOREX', 'CRYPTO', 'STOCKS', 'COMMODITIES', 'INDICES']),
  room: z.enum(['STOCK', 'TRADING', 'INSTITUTIONAL']),
  spread: z.number().min(0).optional(),
  visible: z.boolean().optional(),
  image: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getAuthSession();
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
    const symbol = searchParams.get('symbol');
    const type = searchParams.get('type');
    const room = searchParams.get('room');
    const visibleParam = searchParams.get('visible');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { symbol: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (symbol) {
      where.symbol = { contains: symbol, mode: 'insensitive' };
    }

    if (
      type &&
      ['FOREX', 'CRYPTO', 'STOCKS', 'COMMODITIES', 'INDICES'].includes(type)
    ) {
      where.type = type;
    }

    if (room && ['STOCK', 'TRADING', 'INSTITUTIONAL'].includes(room)) {
      where.room = room;
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
    const session = await getAuthSession();
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

    const {
      symbol,
      type,
      room,
      spread = 0,
      visible = true,
      image
    } = validation.data;
    const upperSymbol = symbol.toUpperCase();

    // Check if market already exists (symbol + type combination should be unique)
    const existingMarket = await prisma.market.findFirst({
      where: {
        symbol: upperSymbol,
        type: type,
        room: room
      }
    });

    if (existingMarket) {
      return NextResponse.json(
        {
          error:
            'Market with this symbol and type and room combination already exists'
        },
        { status: 409 }
      );
    }

    // Validate symbol exists on TwelveData
    const marketData = await twelveDataService.getCombinedData(upperSymbol);

    if ('error' in marketData) {
      return NextResponse.json(
        {
          error: 'Market validation failed',
          message: `Symbol "${upperSymbol}" got error on TwelveData API`
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
        room,
        spread,
        visible,
        lastPrice: isFinite(lastPrice) ? lastPrice : 0,
        lastChange: isFinite(lastChange) ? lastChange : 0,
        ...(image && { image })
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

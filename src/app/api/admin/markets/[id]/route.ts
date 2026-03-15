import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { twelveDataService } from '@/lib/twelvedata';
import { z } from 'zod';

const updateMarketSchema = z.object({
  symbol: z
    .string()
    .min(1, 'Symbol is required')
    .max(12, 'Symbol too long')
    .regex(
      /^[A-Z0-9\-\/\.]+$/,
      'Symbol can only contain uppercase letters, numbers, hyphens, slashes, and dots'
    )
    .optional(),
  type: z
    .enum(['FOREX', 'CRYPTO', 'STOCKS', 'COMMODITIES', 'INDICES'])
    .optional(),
  visible: z.boolean().optional(),
  spread: z.number().min(0).optional(),
  room: z.enum(['STOCK', 'TRADING']).optional(),
  image: z.string().nullable().optional()
});

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: NextRequest, context: RouteParams) {
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

    const { id } = await context.params;
    const body = await request.json();

    // Validate request body
    const validation = updateMarketSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    // Check if market exists
    const existingMarket = await prisma.market.findUnique({
      where: { id }
    });

    if (!existingMarket) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (validation.data.visible !== undefined) {
      updateData.visible = validation.data.visible;
    }
    if (validation.data.spread !== undefined) {
      updateData.spread = validation.data.spread;
    }
    if (validation.data.room !== undefined) {
      updateData.room = validation.data.room;
    }
    if (Object.hasOwn(validation.data, 'image')) {
      updateData.image = validation.data.image;
    }
    if (validation.data.type !== undefined) {
      updateData.type = validation.data.type;
    }

    // If symbol is being updated, validate with TwelveData and update name
    if (validation.data.symbol !== undefined) {
      const upperSymbol = validation.data.symbol.toUpperCase();
      if (upperSymbol !== existingMarket.symbol) {
        const marketData = await twelveDataService.getCombinedData(upperSymbol);
        if ('error' in marketData) {
          return NextResponse.json(
            {
              error: 'Market validation failed',
              message: `Symbol "${upperSymbol}" failed TwelveData API validation`
            },
            { status: 400 }
          );
        }
        const marketName = marketData.name || upperSymbol;
        updateData.symbol = upperSymbol;
        updateData.name = marketName;
      }
    }

    const updatedMarket = await prisma.market.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updatedMarket);
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

export async function DELETE(request: NextRequest, context: RouteParams) {
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

    const { id } = await context.params;

    // Check if market exists
    const existingMarket = await prisma.market.findUnique({
      where: { id }
    });

    if (!existingMarket) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }

    // Check if market has positions
    const positionCount = await prisma.position.count({
      where: { marketId: id }
    });

    if (positionCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete market with existing positions' },
        { status: 409 }
      );
    }

    // Delete the market
    await prisma.market.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Market deleted successfully' });
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

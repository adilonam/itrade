import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Bot } from '@/lib/prisma/generated/client';

const BOT_ENUM_VALUES: Bot[] = ['RSI', 'GRID_TRADING', 'TREND_FOLLOWING'];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      bot,
      dateStart,
      dateStop,
      quantityLot,
      marketId,
      botParams
    } = body as {
      bot?: string;
      dateStart?: string;
      dateStop?: string;
      quantityLot?: number;
      marketId?: string;
      botParams?: Record<string, unknown>;
    };

    if (!bot || !BOT_ENUM_VALUES.includes(bot as Bot)) {
      return NextResponse.json(
        { error: 'Invalid or missing bot. Must be RSI, GRID_TRADING, or TREND_FOLLOWING.' },
        { status: 400 }
      );
    }
    if (!dateStart || !dateStop) {
      return NextResponse.json(
        { error: 'dateStart and dateStop are required (ISO strings).' },
        { status: 400 }
      );
    }
    if (typeof quantityLot !== 'number' || quantityLot <= 0) {
      return NextResponse.json(
        { error: 'quantityLot must be a positive number.' },
        { status: 400 }
      );
    }
    if (!marketId || typeof marketId !== 'string') {
      return NextResponse.json(
        { error: 'marketId is required.' },
        { status: 400 }
      );
    }
    if (!botParams || typeof botParams !== 'object') {
      return NextResponse.json(
        { error: 'botParams must be an object.' },
        { status: 400 }
      );
    }

    const start = new Date(dateStart);
    const stop = new Date(dateStop);
    if (Number.isNaN(start.getTime()) || Number.isNaN(stop.getTime())) {
      return NextResponse.json(
        { error: 'Invalid dateStart or dateStop.' },
        { status: 400 }
      );
    }
    if (stop <= start) {
      return NextResponse.json(
        { error: 'dateStop must be after dateStart.' },
        { status: 400 }
      );
    }

    const market = await prisma.market.findUnique({
      where: { id: marketId, visible: true }
    });
    if (!market) {
      return NextResponse.json(
        { error: 'Market not found or not visible.' },
        { status: 404 }
      );
    }

    const botUser = await prisma.botUser.create({
      data: {
        userId: session.user.id,
        bot: bot as Bot,
        dateStart: start,
        dateStop: stop,
        quantityLot,
        marketId,
        botParams: botParams as object
      },
      include: {
        market: true
      }
    });

    return NextResponse.json({ botUser });
  } catch (e) {
    console.error('POST /api/user/bot-trading/start', e);
    return NextResponse.json(
      { error: 'Failed to create and start bot.' },
      { status: 500 }
    );
  }
}

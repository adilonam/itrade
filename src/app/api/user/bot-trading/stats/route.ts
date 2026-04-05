import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateUserFinancialInfo } from '@/lib/calculator-server';
import { parseBalanceType } from '@/lib/balance';
import { getAuthSession } from '@/lib/auth';

const MAX_BOTS = 20;

/**
 * GET /api/user/bot-trading/stats
 * Returns live stats for the bot trading dashboard: active bots count, 24h profit, total equity, success rate.
 * profit24h and successRate are placeholders (0 / null) until trade history is available.
 */
export async function GET(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const [activeBotsCount, user] = await Promise.all([
      prisma.botUser.count({
        where: { userId, active: true }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, leverage: true }
      })
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const balanceType = parseBalanceType(searchParams.get('balanceType'));
    const financialInfo = await calculateUserFinancialInfo(
      user,
      'TRADING',
      balanceType
    );
    const totalEquity =
      financialInfo != null ? financialInfo.equity : 0;

    const stats = {
      activeBots: activeBotsCount,
      maxBots: MAX_BOTS,
      profit24h: 0,
      totalEquity,
      successRate: null as number | null
    };

    return NextResponse.json(stats);
  } catch (e) {
    console.error('GET /api/user/bot-trading/stats', e);
    return NextResponse.json(
      { error: 'Failed to fetch bot trading stats.' },
      { status: 500 }
    );
  }
}

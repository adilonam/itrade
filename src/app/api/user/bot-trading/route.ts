import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

/**
 * GET /api/user/bot-trading
 * Returns the current user's active bots (BotUser records) with market info.
 */
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const botUsers = await prisma.botUser.findMany({
      where: { userId: session.user.id },
      include: { market: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ bots: botUsers });
  } catch (e) {
    console.error('GET /api/user/bot-trading', e);
    return NextResponse.json(
      { error: 'Failed to fetch bots.' },
      { status: 500 }
    );
  }
}

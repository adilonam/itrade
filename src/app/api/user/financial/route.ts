import { NextRequest, NextResponse } from 'next/server';
import { calculateUserFinancialInfo } from '@/lib/calculator-server';
import { parseBalanceType } from '@/lib/balance';
import { getAuthSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get room query parameter
    const searchParams = request.nextUrl.searchParams;
    const roomParam = searchParams.get('room');
    const room: 'STOCK' | 'TRADING' | 'INSTITUTIONAL' | 'ALL' =
      roomParam && ['STOCK', 'TRADING', 'INSTITUTIONAL', 'ALL'].includes(roomParam)
        ? (roomParam as 'STOCK' | 'TRADING' | 'INSTITUTIONAL' | 'ALL')
        : 'ALL';
    const balanceType = parseBalanceType(searchParams.get('balanceType'));

    // Get user with required fields
    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, leverage: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Use the centralized financial calculation function
    const financialInfo = await calculateUserFinancialInfo(
      user,
      room,
      balanceType
    );

    if (!financialInfo) {
      return NextResponse.json(
        { error: 'Failed to calculate financial information' },
        { status: 500 }
      );
    }

    return NextResponse.json(financialInfo);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Financial metrics calculation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to calculate financial metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

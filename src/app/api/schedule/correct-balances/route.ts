import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const vercelCronHeader = request.headers.get('x-vercel-cron');

    const isAuthorizedCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isVercelCron = vercelCronHeader === '1';

    if (!isAuthorizedCron && !isVercelCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // eslint-disable-next-line no-console -- intentional logging for cron job monitoring
    console.log('Starting scheduled balance correction process...');

    const negativeBalances = await prisma.userBalance.findMany({
      where: { amount: { lt: 0 } },
      select: { id: true, userId: true, type: true, amount: true }
    });

    // eslint-disable-next-line no-console -- intentional logging for cron job monitoring
    console.log(`Found ${negativeBalances.length} negative balances to correct`);

    if (negativeBalances.length === 0) {
      return NextResponse.json({
        message: 'No negative balances to correct',
        corrected: 0
      });
    }

    const result = await prisma.userBalance.updateMany({
      where: { amount: { lt: 0 } },
      data: { amount: 0 }
    });

    // eslint-disable-next-line no-console -- intentional logging for cron job monitoring
    console.log(
      `Balance correction completed: ${result.count} balances set to 0`
    );

    return NextResponse.json({
      message: 'Balance correction completed',
      corrected: result.count,
      balances: negativeBalances.map((balance) => ({
        id: balance.id,
        userId: balance.userId,
        type: balance.type,
        previousAmount: balance.amount
      }))
    });
  } catch (error) {
    // eslint-disable-next-line no-console -- intentional error logging in API route
    console.error('Error in correct-balances schedule:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

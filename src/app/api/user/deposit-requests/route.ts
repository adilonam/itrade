import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  DepositRequestChannel,
  DepositRequestStatus
} from '@/lib/prisma/generated/client';
import { getAuthSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const statusParam = request.nextUrl.searchParams.get('status');
    const channelParam = request.nextUrl.searchParams.get('channel');

    const where: {
      userBalance: { userId: string };
      status?: DepositRequestStatus;
      channel?: DepositRequestChannel;
    } = {
      userBalance: { userId: session.user.id }
    };

    if (statusParam) {
      if (
        !Object.values(DepositRequestStatus).includes(
          statusParam as DepositRequestStatus
        )
      ) {
        return NextResponse.json(
          { error: 'Invalid status filter' },
          { status: 400 }
        );
      }
      where.status = statusParam as DepositRequestStatus;
    }

    if (channelParam === 'GATEWAY' || channelParam === 'MANUAL') {
      where.channel = channelParam as DepositRequestChannel;
    }

    const rows = await prisma.depositRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amountUsd: true,
        payCurrency: true,
        channel: true,
        status: true,
        orderId: true,
        checkoutUrl: true,
        creditedAt: true,
        createdAt: true,
        userBalance: { select: { type: true } }
      }
    });

    const requests = rows.map((r) => ({
      id: r.id,
      amountUsd: r.amountUsd,
      payCurrency: r.payCurrency,
      channel: r.channel,
      status: r.status,
      orderId: r.orderId,
      checkoutUrl: r.checkoutUrl,
      creditedAt: r.creditedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      balanceType: r.userBalance.type
    }));

    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch deposit requests' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DepositRequestStatus } from '@/lib/prisma/generated/client';
import { getAuthSession } from '@/lib/auth';

function isAdmin(session: { user?: { role?: string } } | null) {
  return (
    session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN'
  );
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || !isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const statusParam = request.nextUrl.searchParams.get('status');
    const channelParam = request.nextUrl.searchParams.get('channel');

    const where: {
      status?: DepositRequestStatus;
      channel?: 'GATEWAY' | 'MANUAL';
    } = {};

    if (statusParam) {
      if (
        !Object.values(DepositRequestStatus).includes(
          statusParam as DepositRequestStatus
        )
      ) {
        return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 });
      }
      where.status = statusParam as DepositRequestStatus;
    }

    if (channelParam === 'GATEWAY' || channelParam === 'MANUAL') {
      where.channel = channelParam;
    }

    const requests = await prisma.depositRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        userBalance: {
          select: {
            type: true,
            user: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch deposit requests' },
      { status: 500 }
    );
  }
}

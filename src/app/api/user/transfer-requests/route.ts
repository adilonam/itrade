import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await prisma.transferRequest.findMany({
      where: {
        senderUserBalance: { userId: session.user.id }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        recipientUserBalance: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    const requests = rows.map((r) => ({
      id: r.id,
      amount: r.amount,
      status: r.status,
      createdAt: r.createdAt,
      recipientUser: r.recipientUserBalance.user
    }));

    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch transfer requests' },
      { status: 500 }
    );
  }
}

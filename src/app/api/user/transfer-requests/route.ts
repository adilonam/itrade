import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requests = await prisma.transferRequest.findMany({
      where: { senderUserId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        recipientUser: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch transfer requests' },
      { status: 500 }
    );
  }
}

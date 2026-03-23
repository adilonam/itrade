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

    const userId = session.user.id;

    const [total, unread] = await Promise.all([
      prisma.message.count({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }]
        }
      }),
      prisma.message.count({
        where: {
          receiverId: userId,
          read: false
        }
      })
    ]);

    return NextResponse.json({ total, unread });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch message stats' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

/**
 * @swagger
 * /api/user/messages/stats:
 *   get:
 *     tags:
 *       - User - Messages
 *     summary: Get message stats for user
 *     description: Returns total count and unread count (as receiver) for the current user.
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Stats retrieved successfully
 *       401:
 *         description: Unauthorized
 */

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

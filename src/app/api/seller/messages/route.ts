import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

/**
 * @swagger
 * /api/seller/messages:
 *   get:
 *     tags:
 *       - Seller - Messages
 *     summary: Get messages for seller
 *     description: Retrieve messages where seller is sender or receiver. Requires SELLER, ADMIN, or SUPERADMIN role.
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of messages per page
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */

// Helper function to check seller permissions
async function checkSellerPermission(session: any) {
  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, id: true }
  });

  if (
    !user ||
    (user.role !== 'SELLER' &&
      user.role !== 'ADMIN' &&
      user.role !== 'SUPERADMIN')
  ) {
    return { error: 'Forbidden - insufficient permissions', status: 403 };
  }

  return { user, status: 200 };
}

// Validation schema
const getSellerMessagesSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20)
});

const createMessageSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required'),
  message: z.string().min(1, 'Message is required')
});

// GET - Get messages where seller is sender or receiver
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const permissionCheck = await checkSellerPermission(session);

    if (permissionCheck.error) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const validation = getSellerMessagesSchema.safeParse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { page, limit } = validation.data;
    const skip = (page - 1) * limit;
    const sellerId = permissionCheck.user!.id;

    // Get seller's linked user IDs
    const linkedUsers = await prisma.user.findMany({
      where: { sellerId },
      select: { id: true }
    });
    const linkedUserIds = linkedUsers.map((u) => u.id);

    // Build where clause - messages where seller is sender or receiver
    // AND receiver/sender is one of the linked users
    const where = {
      OR: [
        {
          senderId: sellerId,
          receiverId: { in: linkedUserIds }
        },
        {
          receiverId: sellerId,
          senderId: { in: linkedUserIds }
        }
      ]
    };

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.message.count({ where })
    ]);

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST - Create a new message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const permissionCheck = await checkSellerPermission(session);

    if (permissionCheck.error) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const body = await request.json();
    const validation = createMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { receiverId, message } = validation.data;
    const sellerId = permissionCheck.user!.id;

    // Verify receiver is a linked user
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, sellerId: true }
    });

    if (!receiver) {
      return NextResponse.json(
        { error: 'Receiver not found' },
        { status: 404 }
      );
    }

    if (receiver.sellerId !== sellerId) {
      return NextResponse.json(
        { error: 'Receiver is not linked to this seller' },
        { status: 403 }
      );
    }

    // Create message
    const newMessage = await prisma.message.create({
      data: {
        senderId: sellerId,
        receiverId,
        message
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}

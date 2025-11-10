import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

/**
 * @swagger
 * /api/user/transactions:
 *   get:
 *     tags:
 *       - User - Transactions
 *     summary: Get user transactions
 *     description: Retrieve all transactions for the authenticated user with optional filtering
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
 *         description: Number of transactions per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [GAIN, LOSS, DEPOSIT, WITHDRAW]
 *         description: Filter by transaction type
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           enum: [trade, stock, invest]
 *         description: Filter by transaction category (trade, stock, invest)
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

// Validation schema
const getTransactionsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  type: z.enum(['GAIN', 'LOSS', 'DEPOSIT', 'WITHDRAW']).optional(),
  transactionType: z.enum(['trade', 'stock', 'invest']).optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;

    const validation = getTransactionsSchema.safeParse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      type: searchParams.get('type') || undefined,
      transactionType: searchParams.get('transactionType') || undefined
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { page, limit, type, transactionType } = validation.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId
    };

    // Filter by transaction type (GAIN, LOSS, DEPOSIT, WITHDRAW)
    if (type) {
      where.type = type;
    }

    // Filter by transaction category (trade, stock, invest)
    if (transactionType) {
      const categoryMap: Record<string, string> = {
        trade: 'Trade',
        stock: 'Stock',
        invest: 'Investment'
      };
      where.description = {
        contains: categoryMap[transactionType]
      };
    }

    // Get transactions
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.transaction.count({ where })
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

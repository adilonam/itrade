import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type {
  CreateTransactionData,
  TransactionFilters
} from '@/types/transaction';

/**
 * @swagger
 * /api/admin/transactions:
 *   get:
 *     summary: Get all transactions with filtering and pagination
 *     tags: [Admin, Transactions]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of transactions per page
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [BUY, SELL, DEPOSIT, WITHDRAWAL, TRANSFER_IN, TRANSFER_OUT, FEE, BONUS, REFUND]
 *         description: Filter by transaction type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED, CANCELLED, PROCESSING]
 *         description: Filter by transaction status
 *       - in: query
 *         name: marketId
 *         schema:
 *           type: string
 *         description: Filter by market ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in description
 *     responses:
 *       200:
 *         description: List of transactions
 *   post:
 *     summary: Create a new transaction
 *     tags: [Admin, Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, type, amount]
 *             properties:
 *               userId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [BUY, SELL, DEPOSIT, WITHDRAWAL, TRANSFER_IN, TRANSFER_OUT, FEE, BONUS, REFUND]
 *               status:
 *                 type: string
 *                 enum: [PENDING, COMPLETED, FAILED, CANCELLED, PROCESSING]
 *               marketId:
 *                 type: string
 *               amount:
 *                 type: number
 *               quantity:
 *                 type: number
 *               description:
 *                 type: string
 *               executedAt:
 *                 type: string
 *                 format: date-time
 *               pnl:
 *                 type: number
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const marketId = searchParams.get('marketId');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (status) where.status = status;
    if (marketId) where.marketId = marketId;
    if (search) {
      where.description = {
        contains: search,
        mode: 'insensitive'
      };
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          market: {
            select: {
              id: true,
              symbol: true,
              name: true,
              type: true
            }
          }
        },
        orderBy: {
          executedAt: 'desc'
        },
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

export async function POST(request: NextRequest) {
  try {
    const body: CreateTransactionData = await request.json();

    // Validate required fields
    if (!body.userId || !body.type || body.amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, amount' },
        { status: 400 }
      );
    }

    // Validate amount
    if (body.amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: body.userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if market exists (if provided)
    if (body.marketId) {
      const market = await prisma.market.findUnique({
        where: { id: body.marketId }
      });

      if (!market) {
        return NextResponse.json(
          { error: 'Market not found' },
          { status: 404 }
        );
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: body.userId,
        type: body.type,
        status: body.status || 'PENDING',
        marketId: body.marketId,
        amount: body.amount,
        quantity: body.quantity,
        description: body.description,
        executedAt: body.executedAt,
        pnl: body.pnl
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        market: {
          select: {
            id: true,
            symbol: true,
            name: true,
            type: true
          }
        }
      }
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}

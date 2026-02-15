import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

/**
 * @swagger
 * /api/seller/investments:
 *   get:
 *     tags:
 *       - Seller - Investments
 *     summary: Get user investments of seller's linked users
 *     description: Retrieve user investments (enrollments) for all users linked to the authenticated seller. Requires SELLER, ADMIN, or SUPERADMIN role.
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, COMPLETED, CANCELLED]
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User investments retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

async function checkSellerPermission(
  session: { user?: { id?: string } } | null
) {
  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 as const };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });

  if (
    !user ||
    (user.role !== 'SELLER' &&
      user.role !== 'ADMIN' &&
      user.role !== 'SUPERADMIN')
  ) {
    return {
      error: 'Forbidden - insufficient permissions',
      status: 403 as const
    };
  }

  return { status: 200 as const };
}

const getSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  userId: z.string().optional()
});

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
    const validation = getSchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      userId: searchParams.get('userId') ?? undefined
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { page, limit, status, userId } = validation.data;
    const skip = (page - 1) * limit;
    const sellerId = session?.user?.id;
    if (!sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const where: {
      user: { sellerId: string; id?: string };
      status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    } = {
      user: { sellerId }
    };
    if (status) where.status = status;
    if (userId) where.user.id = userId;

    const [userInvestments, total] = await Promise.all([
      prisma.userInvestment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          investment: {
            select: {
              id: true,
              title: true,
              country: true,
              duration: true,
              rentability: true,
              riskLevel: true
            }
          }
        }
      }),
      prisma.userInvestment.count({ where })
    ]);

    return NextResponse.json({
      userInvestments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch investments' },
      { status: 500 }
    );
  }
}

const createSchema = z.object({
  userId: z.string().min(1, 'User is required'),
  investmentId: z.string().min(1, 'Investment is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  autoReinvest: z.boolean().optional().default(false)
});

/**
 * @swagger
 * /api/seller/investments:
 *   post:
 *     tags:
 *       - Seller - Investments
 *     summary: Create user investment for a linked user
 *     description: Enroll a user linked to the seller in an investment. Deducts from user balance. Requires SELLER, ADMIN, or SUPERADMIN.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, investmentId, amount]
 *             properties:
 *               userId: { type: string }
 *               investmentId: { type: string }
 *               amount: { type: number, minimum: 0 }
 *               autoReinvest: { type: boolean, default: false }
 *     responses:
 *       201:
 *         description: User investment created
 *       400:
 *         description: Validation or business rule error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - user not linked to seller
 */
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

    const sellerId = session?.user?.id;
    if (!sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = createSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parseResult.error.errors },
        { status: 400 }
      );
    }

    const { userId, investmentId, amount, autoReinvest } = parseResult.data;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, balance: true, sellerId: true }
      });

      if (!user || user.sellerId !== sellerId) {
        throw new Error('User not found or not linked to you');
      }

      const investment = await tx.investment.findUnique({
        where: { id: investmentId, isActive: true }
      });

      if (!investment) {
        throw new Error('Investment not found or not active');
      }

      if (amount < investment.minInvestment) {
        throw new Error(
          `Minimum investment amount is ${investment.minInvestment}`
        );
      }

      if (investment.maxInvestment && amount > investment.maxInvestment) {
        throw new Error(
          `Maximum investment amount is ${investment.maxInvestment}`
        );
      }

      if (user.balance < amount) {
        throw new Error('Insufficient user balance');
      }

      if (investment.totalCapacity != null) {
        const remaining = investment.totalCapacity - investment.currentCapacity;
        if (amount > remaining) {
          throw new Error('Investment capacity exceeded');
        }
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + investment.duration);
      const annualReturn = (amount * investment.rentability) / 100;
      const expectedReturn = (annualReturn / 12) * investment.duration;

      const userInvestment = await tx.userInvestment.create({
        data: {
          userId: user.id,
          investmentId,
          amount,
          startDate,
          endDate,
          expectedReturn,
          autoReinvest
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          investment: {
            select: {
              id: true,
              title: true,
              country: true,
              duration: true,
              rentability: true,
              riskLevel: true
            }
          }
        }
      });

      await tx.user.update({
        where: { id: user.id },
        data: { balance: user.balance - amount }
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'WITHDRAW',
          absoluteAmount: amount,
          description: `Investment in ${investment.title} - ${investment.country}`
        }
      });

      await tx.investment.update({
        where: { id: investmentId },
        data: {
          currentCapacity: investment.currentCapacity + amount
        }
      });

      return userInvestment;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to create investment';
    const isBusiness =
      message.includes('not found') ||
      message.includes('not linked') ||
      message.includes('not active') ||
      message.includes('Minimum') ||
      message.includes('Maximum') ||
      message.includes('Insufficient') ||
      message.includes('capacity exceeded');
    return NextResponse.json(
      { error: message },
      { status: isBusiness ? 400 : 500 }
    );
  }
}

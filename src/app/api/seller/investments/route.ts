import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ensureUserBalance } from '@/lib/balance';
import { getAuthSession } from '@/lib/auth';

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
    const session = await getAuthSession();
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

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
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
        select: { id: true, sellerId: true }
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

      const userBalance = await ensureUserBalance(tx, user.id, 'REAL');
      if (userBalance.amount < amount) {
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

      await tx.userBalance.update({
        where: { userId_type: { userId: user.id, type: 'REAL' } },
        data: { amount: userBalance.amount - amount }
      });

      await tx.transaction.create({
        data: {
          userBalanceId: userBalance.id,
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

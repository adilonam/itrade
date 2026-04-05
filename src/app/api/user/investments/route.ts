import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ensureUserBalance, parseBalanceType } from '@/lib/balance';
import { getAuthSession } from '@/lib/auth';

const EnrollmentSchema = z.object({
  investmentId: z.string(),
  amount: z.number().min(0, 'Amount must be positive'),
  autoReinvest: z.boolean().default(false)
});

export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userInvestments = await prisma.userInvestment.findMany({
      where: { userId: session.user.id },
      include: {
        investment: {
          select: {
            id: true,
            title: true,
            country: true,
            duration: true,
            rentability: true,
            riskLevel: true,
            imageUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ userInvestments });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { investmentId, amount, autoReinvest } = EnrollmentSchema.parse(body);
    const balanceType = parseBalanceType(body.balanceType);

    // Start a position to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get user with current balance
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { id: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get investment details
      const investment = await tx.investment.findUnique({
        where: { id: investmentId, isActive: true }
      });

      if (!investment) {
        throw new Error('Investment not found or not active');
      }

      // Validate investment amount
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

      // Check user balance
      const userBalance = await ensureUserBalance(tx, user.id, balanceType);
      if (userBalance.amount < amount) {
        throw new Error('Insufficient balance');
      }

      // Check investment capacity
      if (investment.totalCapacity) {
        const remainingCapacity =
          investment.totalCapacity - investment.currentCapacity;
        if (amount > remainingCapacity) {
          throw new Error('Investment capacity exceeded');
        }
      }

      // Calculate end date and expected return
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + investment.duration);

      const annualReturn = (amount * investment.rentability) / 100;
      const monthlyReturn = annualReturn / 12;
      const expectedReturn = monthlyReturn * investment.duration;

      // Create user investment
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

      // Update user balance
      await tx.userBalance.update({
        where: { userId_type: { userId: user.id, type: balanceType } },
        data: { amount: userBalance.amount - amount }
      });

      // Create transaction record for investment
      await tx.transaction.create({
        data: {
          userBalanceId: userBalance.id,
          type: 'WITHDRAW',
          absoluteAmount: amount,
          description: `Investment in ${investment.title} - ${investment.country}`
        }
      });

      // Update investment current capacity
      await tx.investment.update({
        where: { id: investmentId },
        data: { currentCapacity: investment.currentCapacity + amount }
      });

      return userInvestment;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      const message = error.message;

      if (message === 'Investment not found or not active') {
        return NextResponse.json({ error: message }, { status: 404 });
      }

      if (
        message.includes('Minimum investment') ||
        message.includes('Maximum investment') ||
        message.includes('Insufficient balance') ||
        message.includes('capacity exceeded')
      ) {
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

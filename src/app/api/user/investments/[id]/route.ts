import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { ensureUserBalance, parseBalanceType } from '@/lib/balance';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const balanceType = parseBalanceType(
      request.nextUrl.searchParams.get('balanceType')
    );

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get user investment with related data
      const userInvestment = await tx.userInvestment.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true
            }
          },
          investment: {
            select: {
              id: true,
              title: true,
              country: true,
              currentCapacity: true
            }
          }
        }
      });

      if (!userInvestment) {
        throw new Error('Investment not found');
      }

      // Verify ownership
      if (userInvestment.userId !== session.user.id) {
        throw new Error('Forbidden');
      }

      // Check if investment can be cancelled
      if (userInvestment.status !== 'ACTIVE') {
        throw new Error('Only active investments can be cancelled');
      }

      // Calculate refund amount (you can add penalty logic here)
      // For now, we're returning the full amount
      const refundAmount = userInvestment.amount;
      const penalty = 0; // You can implement penalty calculation here

      // Update user investment status
      await tx.userInvestment.update({
        where: { id },
        data: {
          status: 'CANCELLED'
        }
      });

      // Return funds to user balance
      const userBalance = await ensureUserBalance(
        tx,
        userInvestment.userId,
        balanceType
      );
      await tx.userBalance.update({
        where: {
          userId_type: { userId: userInvestment.userId, type: balanceType }
        },
        data: {
          amount: userBalance.amount + refundAmount
        }
      });

      // Create transaction record for cancellation refund
      await tx.transaction.create({
        data: {
          userId: userInvestment.userId,
          balanceType,
          type: 'DEPOSIT',
          absoluteAmount: refundAmount,
          description: `Investment cancelled: ${userInvestment.investment.title} - ${userInvestment.investment.country}`
        }
      });

      // If there was a penalty, record it
      if (penalty > 0) {
        await tx.transaction.create({
          data: {
            userId: userInvestment.userId,
            balanceType,
            type: 'LOSS',
            absoluteAmount: penalty,
            description: `Early cancellation penalty: ${userInvestment.investment.title}`
          }
        });
      }

      // Update investment current capacity
      await tx.investment.update({
        where: { id: userInvestment.investment.id },
        data: {
          currentCapacity: Math.max(
            0,
            userInvestment.investment.currentCapacity - userInvestment.amount
          )
        }
      });

      return {
        message: 'Investment cancelled successfully',
        refundAmount,
        penalty
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error) {
      const message = error.message;

      if (message === 'Investment not found') {
        return NextResponse.json({ error: message }, { status: 404 });
      }

      if (message === 'Forbidden') {
        return NextResponse.json(
          { error: 'You do not have permission to cancel this investment' },
          { status: 403 }
        );
      }

      if (message === 'Only active investments can be cancelled') {
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

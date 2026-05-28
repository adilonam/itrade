import { getAuthSession } from '@/lib/auth';
import { ensureUserBalance } from '@/lib/balance';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(_: Request, { params }: RouteParams) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin role required' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const result = await prisma.$transaction(async (tx) => {
      const userInvestment = await tx.userInvestment.findUnique({
        where: { id },
        include: {
          investment: {
            select: {
              id: true,
              title: true,
              currentCapacity: true
            }
          }
        }
      });

      if (!userInvestment) {
        throw new Error('USER_INVESTMENT_NOT_FOUND');
      }

      if (userInvestment.status !== 'ACTIVE') {
        throw new Error('ONLY_ACTIVE_CAN_BE_REVOKED');
      }

      const userBalance = await ensureUserBalance(tx, userInvestment.userId, 'REAL');

      await tx.userBalance.update({
        where: {
          userId_type: { userId: userInvestment.userId, type: 'REAL' }
        },
        data: {
          amount: userBalance.amount + userInvestment.amount
        }
      });

      await tx.transaction.create({
        data: {
          userBalanceId: userBalance.id,
          type: 'DEPOSIT',
          absoluteAmount: userInvestment.amount,
          description: `Admin revoked investment: ${userInvestment.investment.title}`
        }
      });

      await tx.investment.update({
        where: { id: userInvestment.investmentId },
        data: {
          currentCapacity: Math.max(
            0,
            userInvestment.investment.currentCapacity - userInvestment.amount
          )
        }
      });

      await tx.userInvestment.delete({ where: { id: userInvestment.id } });

      return {
        revokedId: userInvestment.id,
        refundedAmount: userInvestment.amount
      };
    });

    return NextResponse.json({
      message: 'User investment revoked and refunded successfully',
      ...result
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'USER_INVESTMENT_NOT_FOUND') {
        return NextResponse.json(
          { error: 'User investment not found' },
          { status: 404 }
        );
      }

      if (error.message === 'ONLY_ACTIVE_CAN_BE_REVOKED') {
        return NextResponse.json(
          { error: 'Only active user investments can be revoked' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to revoke user investment' },
      { status: 500 }
    );
  }
}
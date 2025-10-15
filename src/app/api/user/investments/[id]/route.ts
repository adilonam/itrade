import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * @swagger
 * /api/user/investments/{id}:
 *   delete:
 *     tags:
 *       - User - Investments
 *     summary: Cancel an investment
 *     description: Cancel an active investment and return funds to user balance (may include penalties)
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user investment ID
 *     responses:
 *       200:
 *         description: Investment cancelled successfully
 *       400:
 *         description: Bad request - investment cannot be cancelled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the owner of this investment
 *       404:
 *         description: Investment not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get user investment with related data
      const userInvestment = await tx.userInvestment.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              balance: true
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
      await tx.user.update({
        where: { id: userInvestment.userId },
        data: {
          balance: userInvestment.user.balance + refundAmount
        }
      });

      // Create transaction record for cancellation refund
      await tx.transaction.create({
        data: {
          userId: userInvestment.userId,
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

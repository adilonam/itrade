import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { TransactionType } from '@/lib/prisma/generated/client';

/**
 * @swagger
 * /api/user/withdraw:
 *   post:
 *     tags:
 *       - User - Financial
 *     summary: Process user withdrawal
 *     description: Process a withdrawal transaction and update user balance
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - withdrawMethod
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Withdrawal amount
 *               withdrawMethod:
 *                 type: string
 *                 enum: [paypal, bank]
 *                 description: Withdrawal method
 *               withdrawDetails:
 *                 type: object
 *                 description: Withdrawal method specific details
 *     responses:
 *       200:
 *         description: Withdrawal processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 transaction:
 *                   type: object
 *                 newBalance:
 *                   type: number
 *       400:
 *         description: Invalid request data or insufficient funds
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, withdrawMethod, withdrawDetails } = body;

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Amount must be greater than 0.' },
        { status: 400 }
      );
    }

    if (!withdrawMethod || !['paypal', 'bank'].includes(withdrawMethod)) {
      return NextResponse.json(
        { error: 'Invalid withdrawal method. Must be "paypal" or "bank".' },
        { status: 400 }
      );
    }

    // Process withdrawal in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get current user
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { balance: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if user has sufficient balance
      if (user.balance < amount) {
        throw new Error('Insufficient funds');
      }

      // Update user balance
      const newBalance = user.balance - amount;
      await tx.user.update({
        where: { id: session.user.id },
        data: { balance: newBalance }
      });

      // Create withdrawal transaction
      const transaction = await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: TransactionType.WITHDRAW,
          absoluteAmount: amount,
          description: `Withdrawal to ${withdrawMethod === 'paypal' ? 'PayPal' : 'Bank Account'}`
        }
      });

      return { transaction, newBalance };
    });

    return NextResponse.json({
      success: true,
      message: 'Withdrawal processed successfully',
      transaction: result.transaction,
      newBalance: result.newBalance
    });
  } catch (error) {
    console.error('Withdrawal error:', error);

    if (error instanceof Error && error.message === 'Insufficient funds') {
      return NextResponse.json(
        { error: 'Insufficient funds for this withdrawal' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process withdrawal' },
      { status: 500 }
    );
  }
}

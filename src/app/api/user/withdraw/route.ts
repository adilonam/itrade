import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import {
  WithdrawMethod,
  WithdrawRequestStatus
} from '@/lib/prisma/generated/client';

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
    const { amount, withdrawMethod } = body;

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

    const methodEnum =
      withdrawMethod === 'paypal'
        ? WithdrawMethod.PAYPAL
        : WithdrawMethod.BANK_TRANSFER;
    const details = body.withdrawDetails ?? {};

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { balance: true }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const withdrawRequest = await prisma.withdrawRequest.create({
      data: {
        userId: session.user.id,
        amount,
        method: methodEnum,
        status: WithdrawRequestStatus.PENDING,
        details
      }
    });

    return NextResponse.json({
      success: true,
      message:
        'Withdrawal request submitted. You will be notified when it is processed.',
      withdrawRequest,
      newBalance: user.balance
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient funds') {
      return NextResponse.json(
        { error: 'Insufficient funds for this withdrawal' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit withdrawal request' },
      { status: 500 }
    );
  }
}

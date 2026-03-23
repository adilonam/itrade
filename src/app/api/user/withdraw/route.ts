import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import {
  WithdrawMethod,
  WithdrawRequestStatus
} from '@/lib/prisma/generated/client';
import { ensureUserBalance, parseBalanceType } from '@/lib/balance';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, withdrawMethod, balanceType: rawBalanceType } = body;
    const balanceType = parseBalanceType(rawBalanceType);

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
    const details = { ...(body.withdrawDetails ?? {}), balanceType };

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const balance = await prisma.$transaction(async (tx) => {
      const account = await ensureUserBalance(tx, session.user.id, balanceType);
      return account.amount;
    });

    if (balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient funds for this withdrawal' },
        { status: 400 }
      );
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
      balanceType,
      newBalance: balance
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

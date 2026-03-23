import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { TransactionType } from '@/lib/prisma/generated/client';
import { ensureUserBalance, parseBalanceType } from '@/lib/balance';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, paymentMethod, balanceType: rawBalanceType } = body;
    const balanceType = parseBalanceType(rawBalanceType);

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Amount must be greater than 0.' },
        { status: 400 }
      );
    }

    if (!paymentMethod || !['card', 'paypal'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method. Must be "card" or "paypal".' },
        { status: 400 }
      );
    }

    // Process deposit in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get current user
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { id: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const currentBalance = await ensureUserBalance(
        tx,
        session.user.id,
        balanceType
      );
      const newBalance = currentBalance.amount + amount;
      await tx.userBalance.update({
        where: { userId_type: { userId: session.user.id, type: balanceType } },
        data: { amount: newBalance }
      });

      // Create deposit transaction
      const transaction = await tx.transaction.create({
        data: {
          userId: session.user.id,
          balanceType,
          type: TransactionType.DEPOSIT,
          absoluteAmount: amount,
          description: `Deposit via ${paymentMethod === 'card' ? 'Credit/Debit Card' : 'PayPal'}`
        }
      });

      return { transaction, newBalance };
    });

    return NextResponse.json({
      success: true,
      message: 'Deposit processed successfully',
      transaction: result.transaction,
      balanceType,
      newBalance: result.newBalance
    });
  } catch (error) {
    console.error('Deposit error:', error);
    return NextResponse.json(
      { error: 'Failed to process deposit' },
      { status: 500 }
    );
  }
}

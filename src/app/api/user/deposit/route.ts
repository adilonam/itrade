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

    if (balanceType !== 'REAL') {
      return NextResponse.json(
        { error: 'Deposits are only supported for the real balance.' },
        { status: 400 }
      );
    }

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Amount must be greater than 0.' },
        { status: 400 }
      );
    }

    const allowedMethods = [
      'card',
      'paypal',
      'btc',
      'usdc',
      'usdt'
    ] as const;
    if (!paymentMethod || !allowedMethods.includes(paymentMethod)) {
      return NextResponse.json(
        {
          error:
            'Invalid payment method. Must be "card", "paypal", "btc", "usdc", or "usdt".'
        },
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

      const methodLabel: Record<string, string> = {
        card: 'Credit/Debit Card',
        paypal: 'PayPal',
        btc: 'Bitcoin (BTC)',
        usdc: 'USD Coin (USDC)',
        usdt: 'Tether (USDT)'
      };

      // Create deposit transaction
      const transaction = await tx.transaction.create({
        data: {
          userId: session.user.id,
          balanceType,
          type: TransactionType.DEPOSIT,
          absoluteAmount: amount,
          description: `Deposit via ${methodLabel[paymentMethod] ?? paymentMethod}`
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
  } catch {
    return NextResponse.json(
      { error: 'Failed to process deposit' },
      { status: 500 }
    );
  }
}

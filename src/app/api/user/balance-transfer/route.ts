import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TransactionType } from '@/lib/prisma/generated/client';
import { ensureUserBalance } from '@/lib/balance';
import { getAuthSession } from '@/lib/auth';

function parseDirection(raw: unknown) {
  return raw === 'INSTITUTIONAL_TO_REAL'
    ? 'INSTITUTIONAL_TO_REAL'
    : 'REAL_TO_INSTITUTIONAL';
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const amountRaw = Number(body?.amount);
    const amount = Number.isFinite(amountRaw) ? amountRaw : 0;
    const direction = parseDirection(body?.direction);

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Amount must be greater than 0.' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const realBalance = await ensureUserBalance(tx, session.user.id, 'REAL');
      const institutionalBalance = await ensureUserBalance(
        tx,
        session.user.id,
        'INSTITUTIONAL'
      );

      if (direction === 'REAL_TO_INSTITUTIONAL') {
        if (realBalance.amount < amount) {
          return {
            ok: false as const,
            reason: 'INSUFFICIENT_REAL' as const,
            currentRealBalance: realBalance.amount
          };
        }

        const updatedReal = await tx.userBalance.update({
          where: { userId_type: { userId: session.user.id, type: 'REAL' } },
          data: { amount: realBalance.amount - amount }
        });

        const updatedInstitutional = await tx.userBalance.update({
          where: {
            userId_type: { userId: session.user.id, type: 'INSTITUTIONAL' }
          },
          data: { amount: institutionalBalance.amount + amount }
        });

        await tx.transaction.create({
          data: {
            userBalanceId: realBalance.id,
            type: TransactionType.TRANSFER_OUT,
            absoluteAmount: amount,
            description: 'Transfer to institutional balance'
          }
        });

        await tx.transaction.create({
          data: {
            userBalanceId: institutionalBalance.id,
            type: TransactionType.TRANSFER_IN,
            absoluteAmount: amount,
            description: 'Transfer from real balance'
          }
        });

        return {
          ok: true as const,
          realBalance: updatedReal.amount,
          institutionalBalance: updatedInstitutional.amount
        };
      }

      if (institutionalBalance.amount < amount) {
        return {
          ok: false as const,
          reason: 'INSUFFICIENT_INSTITUTIONAL' as const,
          currentInstitutionalBalance: institutionalBalance.amount
        };
      }

      const updatedInstitutional = await tx.userBalance.update({
        where: {
          userId_type: { userId: session.user.id, type: 'INSTITUTIONAL' }
        },
        data: { amount: institutionalBalance.amount - amount }
      });

      const updatedReal = await tx.userBalance.update({
        where: { userId_type: { userId: session.user.id, type: 'REAL' } },
        data: { amount: realBalance.amount + amount }
      });

      await tx.transaction.create({
        data: {
          userBalanceId: institutionalBalance.id,
          type: TransactionType.TRANSFER_OUT,
          absoluteAmount: amount,
          description: 'Transfer to real balance'
        }
      });

      await tx.transaction.create({
        data: {
          userBalanceId: realBalance.id,
          type: TransactionType.TRANSFER_IN,
          absoluteAmount: amount,
          description: 'Transfer from institutional balance'
        }
      });

      return {
        ok: true as const,
        realBalance: updatedReal.amount,
        institutionalBalance: updatedInstitutional.amount
      };
    });

    if (!result.ok) {
      if (result.reason === 'INSUFFICIENT_REAL') {
        return NextResponse.json(
          {
            error: 'Insufficient REAL balance for transfer',
            currentRealBalance: result.currentRealBalance
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        {
          error: 'Insufficient INSTITUTIONAL balance for transfer',
          currentInstitutionalBalance: result.currentInstitutionalBalance
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Balance transferred successfully',
      realBalance: result.realBalance,
      institutionalBalance: result.institutionalBalance
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to transfer balance' },
      { status: 500 }
    );
  }
}

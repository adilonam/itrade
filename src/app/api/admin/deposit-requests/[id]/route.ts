import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import {
  DepositRequestStatus,
  TransactionType
} from '@/lib/prisma/generated/client';
import { z } from 'zod';

function isAdmin(session: { user?: { role?: string } } | null) {
  return (
    session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN'
  );
}

const updateSchema = z.object({
  status: z.nativeEnum(DepositRequestStatus),
  adminNotes: z.string().optional()
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || !isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    const existing = await prisma.depositRequest.findUnique({
      where: { id },
      include: {
        userBalance: { select: { id: true, amount: true } }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const becomesFinished =
      data.status === DepositRequestStatus.FINISHED &&
      existing.status !== DepositRequestStatus.FINISHED;

    await prisma.$transaction(async (tx) => {
      const current = await tx.depositRequest.findUnique({
        where: { id },
        include: {
          userBalance: { select: { id: true, amount: true } }
        }
      });
      if (!current) return;

      const willCredit = becomesFinished && !current.creditedAt;

      if (willCredit) {
        const ub = current.userBalance;
        await tx.userBalance.update({
          where: { id: ub.id },
          data: { amount: ub.amount + current.amountUsd }
        });
        await tx.transaction.create({
          data: {
            userBalanceId: ub.id,
            type: TransactionType.DEPOSIT,
            absoluteAmount: current.amountUsd,
            description: `Manual deposit (USDT) order ${current.orderId}`
          }
        });
      }

      await tx.depositRequest.update({
        where: { id },
        data: {
          status: data.status,
          creditedAt: willCredit ? new Date() : current.creditedAt,
          ...(data.adminNotes !== undefined && { adminNotes: data.adminNotes })
        }
      });
    });

    const updated = await prisma.depositRequest.findUnique({
      where: { id },
      include: {
        userBalance: {
          select: {
            type: true,
            user: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: e.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update deposit request' },
      { status: 500 }
    );
  }
}

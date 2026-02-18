import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { TransactionType } from '@/lib/prisma/generated/client';
import { z } from 'zod';

function isAdmin(session: { user?: { role?: string } } | null) {
  return (
    session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN'
  );
}

const updateSchema = z.object({
  status: z.enum(['PENDING', 'REJECTED', 'PROCESSING', 'CLOSED']),
  adminNotes: z.string().optional()
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    const existing = await prisma.withdrawRequest.findUnique({
      where: { id },
      select: { id: true, userId: true, amount: true, status: true }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (data.status === 'REJECTED' && existing.status !== 'REJECTED') {
      await prisma.$transaction(async (tx) => {
        await tx.withdrawRequest.update({
          where: { id },
          data: {
            status: 'REJECTED',
            ...(data.adminNotes != null && { adminNotes: data.adminNotes })
          }
        });
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            balance: { increment: existing.amount }
          }
        });
        await tx.transaction.create({
          data: {
            userId: existing.userId,
            type: TransactionType.DEPOSIT,
            absoluteAmount: existing.amount,
            description: 'Refund: withdrawal request rejected'
          }
        });
      });
    } else {
      await prisma.withdrawRequest.update({
        where: { id },
        data: {
          status: data.status as
            | 'PENDING'
            | 'REJECTED'
            | 'PROCESSING'
            | 'CLOSED',
          ...(data.adminNotes != null && { adminNotes: data.adminNotes })
        }
      });
    }

    const updated = await prisma.withdrawRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } }
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
      { error: 'Failed to update withdraw request' },
      { status: 500 }
    );
  }
}

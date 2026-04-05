import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getAuthSession } from '@/lib/auth';

function isAdmin(session: { user?: { role?: string } } | null) {
  return (
    session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN'
  );
}

const updateSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'VERIFIED'])
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

    const existing = await prisma.kycVerificationRequest.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const nextUserKycStatus = data.status === 'VERIFIED' ? 'APPROVED' : 'PENDING';

    await prisma.$transaction(async (tx) => {
      await tx.kycVerificationRequest.update({
        where: { id },
        data: {
          status: data.status,
          reviewedById: session.user.id,
          reviewedAt: new Date()
        }
      });

      await tx.user.update({
        where: { id: existing.userId },
        data: {
          kycStatus: nextUserKycStatus
        }
      });
    });

    const updated = await prisma.kycVerificationRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        documents: { orderBy: { createdAt: 'asc' } }
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
      { error: 'Failed to update KYC request' },
      { status: 500 }
    );
  }
}

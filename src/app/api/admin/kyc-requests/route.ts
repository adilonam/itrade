import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

function isAdmin(session: { user?: { role?: string } } | null) {
  return (
    session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN'
  );
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || !isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const status = request.nextUrl.searchParams.get('status');
    const userId = request.nextUrl.searchParams.get('userId');

    const where: {
      status?: 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'REJECTED';
      userId?: string;
    } = {};
    if (status) {
      where.status = status as
        | 'PENDING'
        | 'IN_PROGRESS'
        | 'VERIFIED'
        | 'REJECTED';
    }
    if (userId) {
      where.userId = userId;
    }

    const requests = await prisma.kycVerificationRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        documents: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch KYC requests' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

function isAdmin(session: { user?: { role?: string } } | null) {
  return (
    session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN'
  );
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const status = request.nextUrl.searchParams.get('status');
    const where = status
      ? { status: status as 'PENDING' | 'REJECTED' | 'PROCESSING' | 'CLOSED' }
      : {};

    const requests = await prisma.withdrawRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch withdraw requests' },
      { status: 500 }
    );
  }
}

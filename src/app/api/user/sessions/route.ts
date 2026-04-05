import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await prisma.session.findMany({
      where: { userId: session.user.id },
      orderBy: { expires: 'desc' },
      select: {
        id: true,
        expires: true,
        sessionToken: true
      }
    });

    const sessions = rows.map((row) => ({
      id: row.id,
      expires: row.expires.toISOString(),
      tokenHint: `····${row.sessionToken.slice(-8)}`
    }));

    return NextResponse.json({ sessions });
  } catch {
    return NextResponse.json(
      { error: 'Failed to load sessions' },
      { status: 500 }
    );
  }
}

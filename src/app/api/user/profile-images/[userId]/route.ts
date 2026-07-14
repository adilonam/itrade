import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function canViewProfileImage(
  sessionUser: { id: string; role?: string },
  targetUser: { id: string; sellerId: string | null }
) {
  return (
    sessionUser.id === targetUser.id ||
    sessionUser.role === 'ADMIN' ||
    sessionUser.role === 'SUPERADMIN' ||
    (sessionUser.role === 'SELLER' && targetUser.sellerId === sessionUser.id)
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        sellerId: true,
        profileImageContent: true,
        profileImageContentType: true,
        profileImageFileName: true
      }
    });

    if (!user || !canViewProfileImage(session.user, user)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (!user.profileImageContent?.length || !user.profileImageContentType) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', user.profileImageContentType);
    if (user.profileImageFileName) {
      headers.set(
        'Content-Disposition',
        `inline; filename="${user.profileImageFileName.replace(/"/g, '')}"`
      );
    }
    headers.set('Cache-Control', 'private, no-store');

    return new NextResponse(new Uint8Array(user.profileImageContent), {
      status: 200,
      headers
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to load profile image' },
      { status: 500 }
    );
  }
}

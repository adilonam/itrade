import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ALLOWED_ROLES = ['ADMIN', 'SUPERADMIN'];

function isAllowed(role: string | undefined) {
  return role && ALLOWED_ROLES.includes(role);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !isAllowed(session.user.role as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const settings = await prisma.appSettings.findUnique({
      where: { id: 'default' },
      select: { openMarket: true }
    });

    return NextResponse.json({
      openMarket: settings?.openMarket ?? true
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch app settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !isAllowed(session.user.role as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const openMarket =
      typeof body.openMarket === 'boolean' ? body.openMarket : undefined;

    if (openMarket === undefined) {
      return NextResponse.json(
        { error: 'openMarket (boolean) is required' },
        { status: 400 }
      );
    }

    const settings = await prisma.appSettings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        openMarket
      },
      update: { openMarket },
      select: { openMarket: true }
    });

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update app settings' },
      { status: 500 }
    );
  }
}

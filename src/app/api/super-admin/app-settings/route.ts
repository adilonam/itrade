import { invalidateAppSettingsCache } from '@/lib/app-settings';
import { getAuthSession } from '@/lib/auth';
import type { Prisma } from '@/lib/prisma/generated/client';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ROLES = ['ADMIN', 'SUPERADMIN'];

function isAllowed(role: string | undefined) {
  return !!role && ALLOWED_ROLES.includes(role);
}

export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session || !isAllowed(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const settings = await prisma.appSettings.findUnique({
      where: { id: 'default' }
    });

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session || !isAllowed(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const data: Prisma.AppSettingsUpdateInput = {};

    if (typeof body.openMarket === 'boolean') {
      data.openMarket = body.openMarket;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update.' },
        { status: 400 }
      );
    }

    const existing = await prisma.appSettings.findUnique({
      where: { id: 'default' }
    });

    const settings = existing
      ? await prisma.appSettings.update({
          where: { id: 'default' },
          data
        })
      : await prisma.appSettings.create({
          data: {
            id: 'default',
            openMarket: true,
            ...((data as unknown) as Omit<
              Prisma.AppSettingsUncheckedCreateInput,
              'id' | 'openMarket'
            >)
          }
        });

    invalidateAppSettingsCache();

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}

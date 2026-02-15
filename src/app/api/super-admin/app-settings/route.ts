import { put } from '@vercel/blob';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const settings = await prisma.appSettings.findUnique({
      where: { id: 'default' }
    });

    return NextResponse.json(settings || { appName: 'Trading Dashboard' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await request.formData();
    const appName = formData.get('appName') as string;
    const iconFile = formData.get('icon') as File | null;

    let iconPath: string | undefined;

    if (iconFile && iconFile.size > 0) {
      const ext = iconFile.name.split('.').pop() || 'png';
      const filename = `app-icon-${Date.now()}.${ext}`;
      const blob = await put(filename, iconFile, {
        access: 'public',
        addRandomSuffix: true
      });
      iconPath = blob.url;
    }

    const settings = await prisma.appSettings.upsert({
      where: { id: 'default' },
      update: {
        appName,
        ...(iconPath && { appIcon: iconPath })
      },
      create: {
        id: 'default',
        appName,
        ...(iconPath && { appIcon: iconPath })
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

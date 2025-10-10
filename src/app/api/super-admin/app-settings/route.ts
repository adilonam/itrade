import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

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

    if (iconFile) {
      const bytes = await iconFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), 'public', 'uploads');
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const extension = iconFile.name.split('.').pop();
      const filename = `app-icon-${timestamp}.${extension}`;
      const filepath = join(uploadsDir, filename);

      await writeFile(filepath, buffer);
      iconPath = `/uploads/${filename}`;
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

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const themeSettingsSchema = z.object({
  themeMode: z.enum(['light', 'dark', 'system']),
  themeColor: z.string(),
  reducedMotion: z.boolean(),
  highContrast: z.boolean()
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.appSettings.findFirst();

    return NextResponse.json({
      themeMode: (settings as any)?.themeMode || 'system',
      themeColor: (settings as any)?.themeColor || 'match-trader',
      reducedMotion: (settings as any)?.reducedMotion || false,
      highContrast: (settings as any)?.highContrast || false
    });
  } catch (error) {
    console.error('Failed to fetch global theme settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch theme settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = themeSettingsSchema.parse(body);

    // Check if settings exist
    const existingSettings = await prisma.appSettings.findFirst();

    let updatedSettings;
    if (existingSettings) {
      // Update existing settings
      updatedSettings = await prisma.appSettings.update({
        where: { id: existingSettings.id },
        data: {
          themeMode: validatedData.themeMode,
          themeColor: validatedData.themeColor,
          reducedMotion: validatedData.reducedMotion,
          highContrast: validatedData.highContrast
        } as any
      });
    } else {
      // Create new settings
      updatedSettings = await prisma.appSettings.create({
        data: {
          id: 'default',
          appName: 'Trading Dashboard',
          themeMode: validatedData.themeMode,
          themeColor: validatedData.themeColor,
          reducedMotion: validatedData.reducedMotion,
          highContrast: validatedData.highContrast
        } as any
      });
    }

    return NextResponse.json({
      themeMode: (updatedSettings as any).themeMode,
      themeColor: (updatedSettings as any).themeColor,
      reducedMotion: (updatedSettings as any).reducedMotion,
      highContrast: (updatedSettings as any).highContrast
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Failed to update global theme settings:', error);
    return NextResponse.json(
      { error: 'Failed to update theme settings' },
      { status: 500 }
    );
  }
}

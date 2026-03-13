import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const UserThemeSettingsSchema = z.object({
  userId: z.string(),
  themeMode: z.enum(['light', 'dark', 'system']).optional(),
  themeColor: z.string().optional(),
  reducedMotion: z.boolean().optional(),
  highContrast: z.boolean().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        themeMode: true,
        themeColor: true,
        reducedMotion: true,
        highContrast: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      themeSettings: {
        themeMode: user.themeMode || 'system',
        themeColor: user.themeColor || 'default',
        reducedMotion: user.reducedMotion || false,
        highContrast: user.highContrast || false
      }
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch theme settings' },
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

    const body = await request.json();
    const validatedData = UserThemeSettingsSchema.parse(body);

    const { userId, ...themeSettings } = validatedData;

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!userExists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: themeSettings,
      select: {
        id: true,
        name: true,
        email: true,
        themeMode: true,
        themeColor: true,
        reducedMotion: true,
        highContrast: true
      }
    });

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email
      },
      themeSettings: {
        themeMode: updatedUser.themeMode || 'system',
        themeColor: updatedUser.themeColor || 'default',
        reducedMotion: updatedUser.reducedMotion || false,
        highContrast: updatedUser.highContrast || false
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update theme settings' },
      { status: 500 }
    );
  }
}

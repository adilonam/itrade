import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const ThemeSettingsSchema = z.object({
  themeMode: z.enum(['light', 'dark', 'system']).optional(),
  themeColor: z.string().optional(),
  reducedMotion: z.boolean().optional(),
  highContrast: z.boolean().optional()
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
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
      themeMode: user.themeMode || 'system',
      themeColor: user.themeColor || 'default',
      reducedMotion: user.reducedMotion || false,
      highContrast: user.highContrast || false
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

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = ThemeSettingsSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: validatedData,
      select: {
        themeMode: true,
        themeColor: true,
        reducedMotion: true,
        highContrast: true
      }
    });

    return NextResponse.json({
      themeMode: updatedUser.themeMode || 'system',
      themeColor: updatedUser.themeColor || 'default',
      reducedMotion: updatedUser.reducedMotion || false,
      highContrast: updatedUser.highContrast || false
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

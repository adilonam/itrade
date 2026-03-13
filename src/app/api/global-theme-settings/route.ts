import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.appSettings.findFirst();

    return NextResponse.json({
      themeMode: (settings as any)?.themeMode || 'system',
      themeColor: (settings as any)?.themeColor || 'match-trader',
      reducedMotion: (settings as any)?.reducedMotion || false,
      highContrast: (settings as any)?.highContrast || false
    });
  } catch (error) {
    // eslint-disable-next-line no-console -- intentional error logging in API route
    console.error('Failed to fetch global theme settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch theme settings' },
      { status: 500 }
    );
  }
}

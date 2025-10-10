import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const settings = await prisma.appSettings.findUnique({
      where: { id: 'default' }
    });

    return NextResponse.json(
      settings || {
        appName: 'Trading Dashboard',
        appIcon: null
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        appName: 'Trading Dashboard',
        appIcon: null
      },
      { status: 200 }
    );
  }
}

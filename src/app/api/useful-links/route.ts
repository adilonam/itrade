import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const links = await prisma.usefulLink.findMany({
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        url: true,
        order: true
      }
    });
    return NextResponse.json({ links });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch useful links' },
      { status: 500 }
    );
  }
}

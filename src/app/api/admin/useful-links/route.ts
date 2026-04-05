import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getAuthSession } from '@/lib/auth';

function isAdmin(session: { user?: { role?: string } } | null) {
  return (
    session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN'
  );
}

const createSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  url: z.string().url('Valid URL is required'),
  order: z.coerce.number().int().min(0).optional().default(0)
});

/**
 * GET - List useful links (admin)
 */
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || !isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const links = await prisma.usefulLink.findMany({
      orderBy: { order: 'asc' }
    });
    return NextResponse.json({ links });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch useful links' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create useful link (admin)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || !isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const data = createSchema.parse(body);

    const link = await prisma.usefulLink.create({
      data: {
        title: data.title,
        url: data.url,
        order: data.order
      }
    });
    return NextResponse.json(link, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: e.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create useful link' },
      { status: 500 }
    );
  }
}

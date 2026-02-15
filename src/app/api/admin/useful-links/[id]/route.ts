import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

function isAdmin(session: { user?: { role?: string } } | null) {
  return (
    session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN'
  );
}

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  url: z.string().url().optional(),
  order: z.coerce.number().int().min(0).optional()
});

/**
 * GET - Get one useful link (admin)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const link = await prisma.usefulLink.findUnique({
      where: { id }
    });
    if (!link) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(link);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch useful link' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update useful link (admin)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    const link = await prisma.usefulLink.update({
      where: { id },
      data: {
        ...(data.title != null && { title: data.title }),
        ...(data.url != null && { url: data.url }),
        ...(data.order != null && { order: data.order })
      }
    });
    return NextResponse.json(link);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: e.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update useful link' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete useful link (admin)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await prisma.usefulLink.delete({
      where: { id }
    });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete useful link' },
      { status: 500 }
    );
  }
}

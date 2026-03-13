import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

/**
 * @swagger
 * /api/admin/users/search:
 *   get:
 *     tags:
 *       - Admin - Users
 *     summary: Search users by email
 *     description: Search for users by email address. Requires ADMIN or SUPERADMIN role.
 */

const searchSchema = z.object({
  email: z.string().email('Invalid email address'),
  excludeSellerId: z.string().optional() // Exclude users already linked to this seller
});

async function checkAdminPermission(session: any) {
  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
    return { error: 'Forbidden - insufficient permissions', status: 403 };
  }

  return { user, status: 200 };
}

// GET - Search users by email
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const permissionCheck = await checkAdminPermission(session);

    if (permissionCheck.error) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);

    const validation = searchSchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Build where clause - only show users not linked to any seller
    const where: any = {
      email: {
        contains: email,
        mode: 'insensitive'
      },
      sellerId: null // Only show users that are not linked to any seller
    };

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        sellerId: true
      },
      take: 10,
      orderBy: {
        email: 'asc'
      }
    });

    return NextResponse.json({ users });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Search users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

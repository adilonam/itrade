import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const addUserSchema = z.object({
  email: z.string().email('Invalid email address')
});

const removeUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required')
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

// GET - Get all users linked to a seller
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const permissionCheck = await checkAdminPermission(session);

    if (permissionCheck.error) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '20', 10),
      100
    );
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      sellerId: id
    };

    // Add email filter if provided
    if (search.trim()) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get all users linked to this user (as seller) with pagination and filtering
    const [linkedUsers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          balances: {
            where: { type: 'REAL' },
            select: { amount: true }
          },
          role: true,
          createdAt: true
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({
        where
      })
    ]);

    return NextResponse.json({
      users: linkedUsers.map((u) => ({
        ...u,
        balance: u.balances[0]?.amount ?? 0
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get seller users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add a user to seller by email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sellerId } = await params;
    const session = await getServerSession(authOptions);
    const permissionCheck = await checkAdminPermission(session);

    if (permissionCheck.error) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const body = await request.json();
    const validation = addUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Verify the seller exists and is a seller
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: { id: true, role: true }
    });

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    if (seller.role !== 'SELLER') {
      return NextResponse.json(
        { error: 'User is not a seller' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found with this email' },
        { status: 404 }
      );
    }

    // Check if user is already linked to this seller
    if (user.sellerId === sellerId) {
      return NextResponse.json(
        { error: 'User is already linked to this seller' },
        { status: 409 }
      );
    }

    // Check if user is already linked to another seller
    if (user.sellerId) {
      return NextResponse.json(
        { error: 'User is already linked to another seller' },
        { status: 409 }
      );
    }

    // Link user to seller
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        sellerId: sellerId
      },
      select: {
        id: true,
        name: true,
        email: true,
        balances: {
          where: { type: 'REAL' },
          select: { amount: true }
        },
        role: true,
        createdAt: true
      }
    });

    return NextResponse.json(
      {
        message: 'User added to seller successfully',
        user: {
          ...updatedUser,
          balance: updatedUser.balances[0]?.amount ?? 0
        }
      },
      { status: 200 }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Add user to seller error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a user from seller
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sellerId } = await params;
    const session = await getServerSession(authOptions);
    const permissionCheck = await checkAdminPermission(session);

    if (permissionCheck.error) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const body = await request.json();
    const validation = removeUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { userId } = validation.data;

    // Verify the seller exists
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: { id: true, role: true }
    });

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // Verify the user exists and is linked to this seller
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, sellerId: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.sellerId !== sellerId) {
      return NextResponse.json(
        { error: 'User is not linked to this seller' },
        { status: 400 }
      );
    }

    // Unlink user from seller
    await prisma.user.update({
      where: { id: userId },
      data: {
        sellerId: null
      }
    });

    return NextResponse.json({
      message: 'User removed from seller successfully'
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Remove user from seller error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

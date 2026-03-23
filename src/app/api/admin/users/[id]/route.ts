import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { ensureUserBalance } from '@/lib/balance';

// Validation schemas
const updateUserSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    role: z.enum(['USER', 'SELLER', 'ADMIN', 'SUPERADMIN']).optional(),
    balance: z.number().min(0, 'Balance cannot be negative').optional(),
    leverage: z.number().min(1, 'Leverage must be at least 1').optional(),
    emailVerified: z
      .union([z.string().pipe(z.coerce.date()), z.date(), z.null()])
      .optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
  });

// Helper function to check admin permissions
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

// GET - Get user by ID
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

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        balances: {
          where: { type: 'REAL' },
          select: { amount: true }
        },
        leverage: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            accounts: true,
            sessions: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: { ...user, balance: user.balances[0]?.amount ?? 0 }
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(
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

    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Allow users to modify themselves through admin interface

    const updateData = { ...validation.data };
    const nextRealBalance = updateData.balance;
    delete (updateData as { balance?: number }).balance;

    // Check email uniqueness if email is being updated
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: updateData.email }
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        );
      }
    }

    // Only SUPERADMIN can assign SUPERADMIN role or modify SUPERADMIN users
    if (
      updateData.role === 'SUPERADMIN' &&
      permissionCheck.user?.role !== 'SUPERADMIN'
    ) {
      return NextResponse.json(
        { error: 'Only SUPERADMIN can assign SUPERADMIN role' },
        { status: 403 }
      );
    }

    if (
      existingUser.role === 'SUPERADMIN' &&
      permissionCheck.user?.role !== 'SUPERADMIN'
    ) {
      return NextResponse.json(
        { error: 'Only SUPERADMIN can modify SUPERADMIN users' },
        { status: 403 }
      );
    }

    // Hash password if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    // Update user
    const updatedUser = await prisma.$transaction(async (tx) => {
      if (nextRealBalance != null) {
        await ensureUserBalance(tx, id, 'REAL');
        await tx.userBalance.update({
          where: { userId_type: { userId: id, type: 'REAL' } },
          data: { amount: nextRealBalance }
        });
      }
      return tx.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          balances: {
            where: { type: 'REAL' },
            select: { amount: true }
          },
          leverage: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true
        }
      });
    });

    return NextResponse.json({
      message: 'User updated successfully',
      user: {
        ...updatedUser,
        balance: updatedUser.balances[0]?.amount ?? 0
      }
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(
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

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent users from deleting themselves
    if (session?.user.id === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 403 }
      );
    }

    // Only SUPERADMIN can delete SUPERADMIN users
    if (
      existingUser.role === 'SUPERADMIN' &&
      permissionCheck.user?.role !== 'SUPERADMIN'
    ) {
      return NextResponse.json(
        { error: 'Only SUPERADMIN can delete SUPERADMIN users' },
        { status: 403 }
      );
    }

    // Delete user (CASCADE will handle related records)
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

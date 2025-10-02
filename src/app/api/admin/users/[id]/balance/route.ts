import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

/**
 * @swagger
 * /api/admin/users/{id}/balance:
 *   put:
 *     tags:
 *       - Admin - Users
 *     summary: Update user balance
 *     description: Update a user's account balance. Requires ADMIN or SUPERADMIN role.
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - balance
 *             properties:
 *               balance:
 *                 type: number
 *                 minimum: 0
 *                 description: New balance amount
 *     responses:
 *       200:
 *         description: Balance updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: User not found
 */

// Validation schema
const updateBalanceSchema = z.object({
  balance: z.number().min(0, 'Balance cannot be negative')
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

// PUT - Update user balance
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
    const validation = updateBalanceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent users from modifying their own balance
    if (session?.user.id === id) {
      return NextResponse.json(
        {
          error:
            'Cannot modify your own account balance through admin interface'
        },
        { status: 403 }
      );
    }

    // Only SUPERADMIN can modify SUPERADMIN users
    if (
      existingUser.role === 'SUPERADMIN' &&
      permissionCheck.user?.role !== 'SUPERADMIN'
    ) {
      return NextResponse.json(
        { error: 'Only SUPERADMIN can modify SUPERADMIN users' },
        { status: 403 }
      );
    }

    const { balance } = validation.data;

    // Update user balance
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { balance },
      select: {
        id: true,
        name: true,
        email: true,
        balance: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      message: 'Balance updated successfully',
      user: updatedUser
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Update balance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

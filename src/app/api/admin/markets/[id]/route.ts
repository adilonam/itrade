import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

/**
 * @swagger
 * /api/admin/markets/{id}:
 *   put:
 *     tags:
 *       - Admin - Markets
 *     summary: Update market visibility
 *     description: Update market visibility and other properties. Requires ADMIN or SUPERADMIN role.
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Market ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               visible:
 *                 type: boolean
 *                 description: Market visibility
 *               spread:
 *                 type: number
 *                 minimum: 0
 *                 description: Market spread
 *     responses:
 *       200:
 *         description: Market updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires admin role
 *       404:
 *         description: Market not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     tags:
 *       - Admin - Markets
 *     summary: Delete a market
 *     description: Delete a market from the system. Requires ADMIN or SUPERADMIN role.
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Market ID
 *     responses:
 *       200:
 *         description: Market deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires admin role
 *       404:
 *         description: Market not found
 *       409:
 *         description: Cannot delete market with existing positions
 *       500:
 *         description: Internal server error
 */

const updateMarketSchema = z.object({
  visible: z.boolean().optional(),
  spread: z.number().min(0).optional(),
  room: z.enum(['STOCK', 'TRADING']).optional()
});

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();

    // Validate request body
    const validation = updateMarketSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    // Check if market exists
    const existingMarket = await prisma.market.findUnique({
      where: { id }
    });

    if (!existingMarket) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }

    // Update the market
    const updatedMarket = await prisma.market.update({
      where: { id },
      data: validation.data
    });

    return NextResponse.json(updatedMarket);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;

    // Check if market exists
    const existingMarket = await prisma.market.findUnique({
      where: { id }
    });

    if (!existingMarket) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }

    // Check if market has positions
    const positionCount = await prisma.position.count({
      where: { marketId: id }
    });

    if (positionCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete market with existing positions' },
        { status: 409 }
      );
    }

    // Delete the market
    await prisma.market.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Market deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

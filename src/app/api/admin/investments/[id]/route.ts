import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const UpdateInvestmentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  country: z.string().min(1).optional(),
  duration: z.number().min(1).optional(),
  rentability: z.number().min(0).optional(),
  minInvestment: z.number().min(0).optional(),
  maxInvestment: z.number().optional(),
  autoReinvestment: z.boolean().optional(),
  totalCapacity: z.number().optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  isActive: z.boolean().optional(),
  imageUrl: z.string().url().optional()
});

/**
 * @swagger
 * /api/admin/investments/{id}:
 *   get:
 *     tags:
 *       - Admin - Investments
 *     summary: Get investment by ID
 *     description: Retrieve a specific investment by ID. Requires ADMIN or SUPERADMIN role.
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Investment ID
 *     responses:
 *       200:
 *         description: Investment retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Investment not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin role required' },
        { status: 403 }
      );
    }

    const investment = await prisma.investment.findUnique({
      where: { id: params.id },
      include: {
        userInvestments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: { userInvestments: true }
        }
      }
    });

    if (!investment) {
      return NextResponse.json(
        { error: 'Investment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(investment);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/admin/investments/{id}:
 *   put:
 *     tags:
 *       - Admin - Investments
 *     summary: Update investment
 *     description: Update an existing investment. Requires ADMIN or SUPERADMIN role.
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Investment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               country:
 *                 type: string
 *               duration:
 *                 type: integer
 *               rentability:
 *                 type: number
 *               minInvestment:
 *                 type: number
 *               maxInvestment:
 *                 type: number
 *               autoReinvestment:
 *                 type: boolean
 *               totalCapacity:
 *                 type: number
 *               riskLevel:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *               isActive:
 *                 type: boolean
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Investment updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Investment not found
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = UpdateInvestmentSchema.parse(body);

    // Check if investment exists
    const existingInvestment = await prisma.investment.findUnique({
      where: { id: params.id }
    });

    if (!existingInvestment) {
      return NextResponse.json(
        { error: 'Investment not found' },
        { status: 404 }
      );
    }

    // Validate maxInvestment is greater than minInvestment if both are provided
    const minInvestment =
      validatedData.minInvestment ?? existingInvestment.minInvestment;
    const maxInvestment =
      validatedData.maxInvestment ?? existingInvestment.maxInvestment;

    if (maxInvestment && maxInvestment <= minInvestment) {
      return NextResponse.json(
        { error: 'Maximum investment must be greater than minimum investment' },
        { status: 400 }
      );
    }

    const investment = await prisma.investment.update({
      where: { id: params.id },
      data: validatedData
    });

    return NextResponse.json(investment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/admin/investments/{id}:
 *   delete:
 *     tags:
 *       - Admin - Investments
 *     summary: Delete investment
 *     description: Delete an investment. Only allowed if no active user investments exist. Requires ADMIN or SUPERADMIN role.
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Investment ID
 *     responses:
 *       200:
 *         description: Investment deleted successfully
 *       400:
 *         description: Cannot delete investment with active enrollments
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Investment not found
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin role required' },
        { status: 403 }
      );
    }

    // Check if investment exists
    const investment = await prisma.investment.findUnique({
      where: { id: params.id },
      include: {
        userInvestments: {
          where: {
            status: 'ACTIVE'
          }
        }
      }
    });

    if (!investment) {
      return NextResponse.json(
        { error: 'Investment not found' },
        { status: 404 }
      );
    }

    // Check if there are active user investments
    if (investment.userInvestments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete investment with active enrollments' },
        { status: 400 }
      );
    }

    await prisma.investment.delete({
      where: { id: params.id }
    });

    return NextResponse.json(
      { message: 'Investment deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

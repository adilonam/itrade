import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

/**
 * @swagger
 * /api/admin/investments:
 *   get:
 *     tags:
 *       - Admin - Investments
 *     summary: Get all investments
 *     description: Retrieve a list of all investments with pagination. Requires ADMIN or SUPERADMIN role.
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of investments per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter investments by title or country
 *     responses:
 *       200:
 *         description: Investments retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin role required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where clause for search
    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { country: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } }
          ]
        }
      : {};

    const [investments, total] = await Promise.all([
      prisma.investment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { userInvestments: true }
          }
        }
      }),
      prisma.investment.count({ where })
    ]);

    return NextResponse.json({
      investments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching investments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

const CreateInvestmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  duration: z.number().min(1, 'Duration must be at least 1 month'),
  rentability: z.number().min(0, 'Rentability must be positive'),
  minInvestment: z.number().min(0, 'Minimum investment must be positive'),
  maxInvestment: z.number().optional(),
  autoReinvestment: z.boolean().default(false),
  totalCapacity: z.number().optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  isActive: z.boolean().default(true),
  imageUrl: z.string().url().optional()
});

/**
 * @swagger
 * /api/admin/investments:
 *   post:
 *     tags:
 *       - Admin - Investments
 *     summary: Create new investment
 *     description: Create a new investment offering. Requires ADMIN or SUPERADMIN role.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - country
 *               - duration
 *               - rentability
 *               - minInvestment
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               country:
 *                 type: string
 *               duration:
 *                 type: integer
 *                 minimum: 1
 *               rentability:
 *                 type: number
 *                 minimum: 0
 *               minInvestment:
 *                 type: number
 *                 minimum: 0
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
 *                 format: uri
 *     responses:
 *       201:
 *         description: Investment created successfully
 *       400:
 *         description: Bad request - Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = CreateInvestmentSchema.parse(body);

    // Validate maxInvestment is greater than minInvestment if provided
    if (
      validatedData.maxInvestment &&
      validatedData.maxInvestment <= validatedData.minInvestment
    ) {
      return NextResponse.json(
        { error: 'Maximum investment must be greater than minimum investment' },
        { status: 400 }
      );
    }

    const investment = await prisma.investment.create({
      data: validatedData
    });

    return NextResponse.json(investment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating investment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

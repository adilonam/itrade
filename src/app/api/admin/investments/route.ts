import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

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
  } catch {
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

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

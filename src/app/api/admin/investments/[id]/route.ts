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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      where: { id },
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      where: { id }
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
      where: { id },
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      where: { id },
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
      where: { id }
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

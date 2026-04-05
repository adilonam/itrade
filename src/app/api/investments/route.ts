import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const riskLevel = searchParams.get('riskLevel');
    const minDuration = searchParams.get('minDuration');
    const maxDuration = searchParams.get('maxDuration');

    // Build where clause for filters
    const where: any = {
      isActive: true
    };

    if (riskLevel) {
      where.riskLevel = riskLevel;
    }

    if (minDuration || maxDuration) {
      where.duration = {};
      if (minDuration) {
        where.duration.gte = parseInt(minDuration);
      }
      if (maxDuration) {
        where.duration.lte = parseInt(maxDuration);
      }
    }

    const investments = await prisma.investment.findMany({
      where,
      orderBy: [{ rentability: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        rentability: true,
        minInvestment: true,
        maxInvestment: true,
        autoReinvestment: true,
        totalCapacity: true,
        currentCapacity: true,
        riskLevel: true,
        imageUrl: true,
        createdAt: true,
        _count: {
          select: { userInvestments: true }
        }
      }
    });

    return NextResponse.json({ investments });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

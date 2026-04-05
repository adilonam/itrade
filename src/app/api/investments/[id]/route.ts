import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const investment = await prisma.investment.findUnique({
      where: {
        id,
        isActive: true
      },
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

    if (!investment) {
      return NextResponse.json(
        { error: 'Investment not found' },
        { status: 404 }
      );
    }

    // Calculate availability
    const availableCapacity = investment.totalCapacity
      ? investment.totalCapacity - investment.currentCapacity
      : null;

    return NextResponse.json({
      ...investment,
      availableCapacity
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

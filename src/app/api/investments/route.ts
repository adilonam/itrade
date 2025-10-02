import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

/**
 * @swagger
 * /api/investments:
 *   get:
 *     tags:
 *       - Investments
 *     summary: Get active investments
 *     description: Retrieve all active investment opportunities available to users
 *     parameters:
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter by country
 *       - in: query
 *         name: riskLevel
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH]
 *         description: Filter by risk level
 *       - in: query
 *         name: minDuration
 *         schema:
 *           type: integer
 *         description: Filter by minimum duration in months
 *       - in: query
 *         name: maxDuration
 *         schema:
 *           type: integer
 *         description: Filter by maximum duration in months
 *     responses:
 *       200:
 *         description: Active investments retrieved successfully
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const riskLevel = searchParams.get('riskLevel');
    const minDuration = searchParams.get('minDuration');
    const maxDuration = searchParams.get('maxDuration');

    // Build where clause for filters
    const where: any = {
      isActive: true
    };

    if (country) {
      where.country = { contains: country, mode: 'insensitive' };
    }

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
        country: true,
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

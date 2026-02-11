import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PositionType, PositionStatus } from '@/lib/prisma/generated/client';
// Position stats type
type PositionStats = {
  totalPositions: number;
  totalVolume: number;
  totalPnL: number;
  completedPositions: number;
  pendingPositions: number;
  failedPositions: number;
};

/**
 * @swagger
 * /api/admin/positions/stats:
 *   get:
 *     summary: Get position statistics
 *     tags: [Admin, Positions]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for statistics
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for statistics
 *     responses:
 *       200:
 *         description: Position statistics with enums
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalPositions:
 *                       type: number
 *                     totalVolume:
 *                       type: number
 *                     totalPnL:
 *                       type: number
 *                     completedPositions:
 *                       type: number
 *                     pendingPositions:
 *                       type: number
 *                     failedPositions:
 *                       type: number
 *                 enums:
 *                   type: object
 *                   properties:
 *                     positionTypes:
 *                       type: array
 *                       items:
 *                         type: string
 *                         enum: [BUY, SELL, DEPOSIT, WITHDRAWAL, TRANSFER_IN, TRANSFER_OUT, FEE, BONUS, REFUND]
 *                     positionStatuses:
 *                       type: array
 *                       items:
 *                         type: string
 *                         enum: [PLACED, CLOSED, FAILED, PENDING]
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build where clause
    const where: any = {};
    if (userId) where.userId = userId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [
      totalPositions,
      totalVolume,
      totalPnL,
      placedPositions,
      closedPositions,
      failedPositions,
      processingPositions
    ] = await Promise.all([
      prisma.position.count({ where }),
      prisma.position.aggregate({
        where,
        _sum: { quantity: true }
      }),
      prisma.position.aggregate({
        where: {
          ...where,
          pnl: { not: null }
        },
        _sum: { pnl: true }
      }),
      prisma.position.count({
        where: { ...where, status: PositionStatus.PLACED }
      }),
      prisma.position.count({
        where: { ...where, status: PositionStatus.CLOSED }
      }),
      prisma.position.count({
        where: { ...where, status: PositionStatus.FAILED }
      }),
      prisma.position.count({
        where: { ...where, status: PositionStatus.PENDING }
      })
    ]);

    const stats: PositionStats = {
      totalPositions,
      totalVolume: totalVolume._sum.quantity || 0,
      totalPnL: totalPnL._sum.pnl || 0,
      completedPositions: closedPositions,
      pendingPositions: placedPositions + processingPositions,
      failedPositions
    };

    return NextResponse.json({
      stats,
      enums: {
        positionTypes: Object.values(PositionType),
        positionStatuses: Object.values(PositionStatus)
      }
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching position stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch position statistics' },
      { status: 500 }
    );
  }
}

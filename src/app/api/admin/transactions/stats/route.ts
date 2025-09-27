import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { TransactionStats } from '@/types/transaction';

/**
 * @swagger
 * /api/admin/transactions/stats:
 *   get:
 *     summary: Get transaction statistics
 *     tags: [Admin, Transactions]
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
 *         description: Transaction statistics
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
      totalTransactions,
      totalVolume,
      totalPnL,
      completedTransactions,
      pendingTransactions,
      failedTransactions
    ] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.aggregate({
        where,
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: {
          ...where,
          pnl: { not: null }
        },
        _sum: { pnl: true }
      }),
      prisma.transaction.count({
        where: { ...where, status: 'COMPLETED' }
      }),
      prisma.transaction.count({
        where: { ...where, status: 'PENDING' }
      }),
      prisma.transaction.count({
        where: { ...where, status: 'FAILED' }
      })
    ]);

    const stats: TransactionStats = {
      totalTransactions,
      totalVolume: totalVolume._sum.amount || 0,
      totalPnL: totalPnL._sum.pnl || 0,
      completedTransactions,
      pendingTransactions,
      failedTransactions
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction statistics' },
      { status: 500 }
    );
  }
}

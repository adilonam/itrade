import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TransactionType, TransactionStatus } from '@prisma/client';
// Transaction stats type
type TransactionStats = {
  totalTransactions: number;
  totalVolume: number;
  totalPnL: number;
  completedTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
};

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
 *         description: Transaction statistics with enums
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalTransactions:
 *                       type: number
 *                     totalVolume:
 *                       type: number
 *                     totalPnL:
 *                       type: number
 *                     completedTransactions:
 *                       type: number
 *                     pendingTransactions:
 *                       type: number
 *                     failedTransactions:
 *                       type: number
 *                 enums:
 *                   type: object
 *                   properties:
 *                     transactionTypes:
 *                       type: array
 *                       items:
 *                         type: string
 *                         enum: [BUY, SELL, DEPOSIT, WITHDRAWAL, TRANSFER_IN, TRANSFER_OUT, FEE, BONUS, REFUND]
 *                     transactionStatuses:
 *                       type: array
 *                       items:
 *                         type: string
 *                         enum: [PLACED, CLOSED, FAILED, PROCESSING]
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
      placedTransactions,
      closedTransactions,
      failedTransactions,
      processingTransactions
    ] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.aggregate({
        where,
        _sum: { quantity: true }
      }),
      prisma.transaction.aggregate({
        where: {
          ...where,
          pnl: { not: null }
        },
        _sum: { pnl: true }
      }),
      prisma.transaction.count({
        where: { ...where, status: TransactionStatus.PLACED }
      }),
      prisma.transaction.count({
        where: { ...where, status: TransactionStatus.CLOSED }
      }),
      prisma.transaction.count({
        where: { ...where, status: TransactionStatus.FAILED }
      }),
      prisma.transaction.count({
        where: { ...where, status: TransactionStatus.PROCESSING }
      })
    ]);

    const stats: TransactionStats = {
      totalTransactions,
      totalVolume: totalVolume._sum.quantity || 0,
      totalPnL: totalPnL._sum.pnl || 0,
      completedTransactions: closedTransactions,
      pendingTransactions: placedTransactions + processingTransactions,
      failedTransactions
    };

    return NextResponse.json({
      stats,
      enums: {
        transactionTypes: Object.values(TransactionType),
        transactionStatuses: Object.values(TransactionStatus)
      }
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching transaction stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction statistics' },
      { status: 500 }
    );
  }
}

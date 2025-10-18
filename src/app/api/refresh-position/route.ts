import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  refreshSaveMarkets,
  calculatePositionPnL,
  calculateUserFinancialInfo
} from '@/lib/calculator-server';

/**
 * @swagger
 * /api/refresh-position:
 *   get:
 *     summary: Scheduled endpoint to refresh position data and update PnL calculations
 *     tags: [Schedule, Positions]
 *     security:
 *       - BearerAuth: []
 *       - VercelCron: []
 *     responses:
 *       200:
 *         description: Position refresh completed successfully
 *       401:
 *         description: Unauthorized - Invalid authentication
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const authHeader = request.headers.get('authorization');
    const cronHeader = request.headers.get('x-vercel-cron');
    const cronSecret = process.env.CRON_SECRET;

    // Check for Vercel cron header or CRON_SECRET bearer token
    const isVercelCron = cronHeader === '1';
    const isBearerAuth =
      authHeader?.startsWith('Bearer ') &&
      cronSecret &&
      authHeader === `Bearer ${cronSecret}`;

    if (!isVercelCron && !isBearerAuth) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid authentication' },
        { status: 401 }
      );
    }

    // eslint-disable-next-line no-console
    console.log(
      '🔄 Refresh position job executed at:',
      new Date().toISOString()
    );

    // Step 1: Get all active positions with their markets and users
    const activePositions = await prisma.position.findMany({
      where: {
        status: 'PLACED'
      },
      include: {
        user: true,
        market: true
      }
    });

    // eslint-disable-next-line no-console
    console.log(`Found ${activePositions.length} active positions to refresh`);

    if (activePositions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active positions to refresh',
        processed: 0,
        updated: 0,
        timestamp: new Date().toISOString()
      });
    }

    // Step 2: Get unique markets and refresh their data
    const uniqueMarkets = Array.from(
      new Map(
        activePositions
          .filter((pos) => pos.market)
          .map((pos) => [pos.market!.id, pos.market!])
      ).values()
    );

    // eslint-disable-next-line no-console
    console.log(`Refreshing data for ${uniqueMarkets.length} unique markets`);

    const refreshedMarkets = await refreshSaveMarkets(uniqueMarkets);
    if (!refreshedMarkets) {
      // eslint-disable-next-line no-console
      console.warn('Failed to refresh market data');
      return NextResponse.json(
        { error: 'Failed to refresh market data' },
        { status: 500 }
      );
    }

    // Step 3: Update PnL for each position
    let updatedCount = 0;
    let errorCount = 0;
    const results = [];

    for (const position of activePositions) {
      try {
        if (!position.market) {
          // eslint-disable-next-line no-console
          console.warn(`Position ${position.id} has no market data`);
          continue;
        }

        // Calculate current PnL
        const currentPnL = await calculatePositionPnL(position);

        if (currentPnL !== null) {
          // Update position with new PnL
          await prisma.position.update({
            where: { id: position.id },
            data: { pnl: currentPnL }
          });

          updatedCount++;
          results.push({
            positionId: position.id,
            symbol: position.market.symbol,
            type: position.type,
            pnl: currentPnL,
            status: 'updated'
          });

          // eslint-disable-next-line no-console
          console.log(
            `Updated position ${position.id} (${position.market.symbol}) PnL: ${currentPnL}`
          );
        } else {
          results.push({
            positionId: position.id,
            symbol: position.market.symbol,
            type: position.type,
            status: 'skipped',
            reason: 'Unable to calculate PnL'
          });
        }
      } catch (error) {
        errorCount++;
        // eslint-disable-next-line no-console
        console.error(`Error updating position ${position.id}:`, error);

        results.push({
          positionId: position.id,
          symbol: position.market?.symbol || 'Unknown',
          type: position.type,
          status: 'error',
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Step 4: Update user financial information (optional - for margin level monitoring)
    const uniqueUsers = Array.from(
      new Set(activePositions.map((pos) => pos.userId))
    );

    let usersUpdated = 0;
    for (const userId of uniqueUsers) {
      try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          const financialInfo = await calculateUserFinancialInfo(user);
          if (financialInfo) {
            // Log margin level for monitoring (could trigger alerts if needed)
            // eslint-disable-next-line no-console
            console.log(
              `User ${user.email} - Margin Level: ${financialInfo.marginLevel}%, Equity: ${financialInfo.equity}`
            );
            usersUpdated++;
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(
          `Error calculating financial info for user ${userId}:`,
          error
        );
      }
    }

    const summary = {
      success: true,
      message: 'Position refresh completed successfully',
      timestamp: new Date().toISOString(),
      statistics: {
        totalPositions: activePositions.length,
        marketsRefreshed: uniqueMarkets.length,
        positionsUpdated: updatedCount,
        positionsWithErrors: errorCount,
        usersProcessed: usersUpdated
      },
      results: results.slice(0, 10) // Limit results to first 10 for response size
    };

    // eslint-disable-next-line no-console
    console.log('Position refresh summary:', summary.statistics);

    return NextResponse.json(summary);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Refresh position job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Refresh position job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Handle POST requests as well for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}

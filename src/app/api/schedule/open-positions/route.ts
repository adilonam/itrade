import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { refreshSaveMarkets, couldOpenPosition } from '@/lib/calculator-server';

/**
 * @swagger
 * /api/schedule/open-positions:
 *   get:
 *     summary: Scheduled endpoint to automatically process pending positions and convert them to PLACED when conditions are met
 *     tags: [Schedule, Positions]
 *     responses:
 *       200:
 *         description: Positions processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 processed:
 *                   type: number
 *                 placed:
 *                   type: number
 *                 failed:
 *                   type: number
 *                 skipped:
 *                   type: number
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       symbol:
 *                         type: string
 *                       type:
 *                         type: string
 *                       status:
 *                         type: string
 *                       reason:
 *                         type: string
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  try {
    console.log('Starting scheduled position opening process...');

    // Get all PENDING positions with user and market data
    const pendingPositions = await prisma.position.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        user: true,
        market: true
      }
    });

    console.log(
      `Found ${pendingPositions.length} pending positions to process`
    );

    if (pendingPositions.length === 0) {
      return NextResponse.json({
        message: 'No pending positions to process',
        processed: 0,
        placed: 0,
        failed: 0,
        skipped: 0,
        results: []
      });
    }

    // Get all unique markets to refresh their data
    const marketMap = new Map();
    pendingPositions.forEach((pos) => {
      if (pos.market) {
        marketMap.set(pos.market.id, pos.market);
      }
    });
    const markets = Array.from(marketMap.values());

    // Refresh market data for all positions
    const refreshedMarkets = await refreshSaveMarkets(markets);
    if (!refreshedMarkets) {
      console.warn('Failed to refresh market data for position processing');
      return NextResponse.json(
        { error: 'Failed to refresh market data' },
        { status: 500 }
      );
    }

    // Create a map of refreshed market data for quick lookup
    const marketDataMap = new Map();
    refreshedMarkets.forEach((market) => {
      marketDataMap.set(market.id, market);
    });

    const results = [];
    let placedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    // Process each pending position
    for (const position of pendingPositions) {
      try {
        const refreshedMarket = marketDataMap.get(position.marketId);
        if (!refreshedMarket) {
          console.warn(`No market data found for position ${position.id}`);
          results.push({
            id: position.id,
            symbol: position.market?.symbol || 'Unknown',
            type: position.type,
            status: 'FAILED',
            reason: 'Market data not available'
          });
          failedCount++;
          continue;
        }

        const currentPrice = refreshedMarket.lastPrice;
        if (!currentPrice || currentPrice <= 0) {
          console.warn(`Invalid current price for position ${position.id}`);
          results.push({
            id: position.id,
            symbol: position.market.symbol,
            type: position.type,
            status: 'FAILED',
            reason: 'Invalid current market price'
          });
          failedCount++;
          continue;
        }

        // Check if price conditions are met for the position
        let priceConditionMet = false;
        let priceReason = '';

        if (position.type === 'BUY') {
          // For BUY orders, current price should be higher than or equal to executed price
          if (currentPrice >= (position.executedPrice || 0)) {
            priceConditionMet = true;
            priceReason = `Current price ${currentPrice} >= executed price ${position.executedPrice}`;
          } else {
            priceReason = `Current price ${currentPrice} < executed price ${position.executedPrice}`;
          }
        } else if (position.type === 'SELL') {
          // For SELL orders, current price should be lower than or equal to executed price
          if (currentPrice <= (position.executedPrice || 0)) {
            priceConditionMet = true;
            priceReason = `Current price ${currentPrice} <= executed price ${position.executedPrice}`;
          } else {
            priceReason = `Current price ${currentPrice} > executed price ${position.executedPrice}`;
          }
        }

        if (!priceConditionMet) {
          console.log(
            `Price condition not met for position ${position.id}: ${priceReason}`
          );
          results.push({
            id: position.id,
            symbol: position.market.symbol,
            type: position.type,
            status: 'SKIPPED',
            reason: priceReason
          });
          skippedCount++;
          continue;
        }

        // Update the position with current market data for validation
        const positionWithCurrentMarket = {
          ...position,
          market: refreshedMarket
        };

        // Check if user can open this position (balance, margin, etc.)
        const positionCheck = await couldOpenPosition(
          positionWithCurrentMarket as any
        );

        if (!positionCheck || !positionCheck.canOpen) {
          console.log(
            `Position ${position.id} cannot be opened: insufficient margin`
          );

          // Update position to FAILED status
          await prisma.position.update({
            where: { id: position.id },
            data: {
              status: 'FAILED',
              requiredMargin: positionCheck?.newPositionRequiredMargin || 0,
              description:
                position.description ||
                'Position failed due to insufficient margin'
            }
          });

          results.push({
            id: position.id,
            symbol: position.market.symbol,
            type: position.type,
            status: 'FAILED',
            reason: 'Insufficient margin or balance'
          });
          failedCount++;
          continue;
        }

        // All conditions are met, convert to PLACED status
        await prisma.$transaction(async (tx) => {
          // Update the position to PLACED status
          await tx.position.update({
            where: { id: position.id },
            data: {
              status: 'PLACED',
              executedPrice: currentPrice, // Update with current market price
              requiredMargin: positionCheck.newPositionRequiredMargin,
              executedAt: new Date()
            }
          });

          // No balance update needed - margin is already calculated and reserved by couldOpenPosition
          // STOCK room: leverage = 1, TRADING room: leverage = user.leverage

          return;
        });

        console.log(
          `Successfully placed position ${position.id} at price ${currentPrice}`
        );
        results.push({
          id: position.id,
          symbol: position.market.symbol,
          type: position.type,
          status: 'PLACED',
          reason: `Position placed at current market price ${currentPrice}`
        });
        placedCount++;
      } catch (error) {
        console.error(`Error processing position ${position.id}:`, error);

        // Update position to FAILED status
        await prisma.position.update({
          where: { id: position.id },
          data: {
            status: 'FAILED',
            description: `Position failed due to processing error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        });

        results.push({
          id: position.id,
          symbol: position.market?.symbol || 'Unknown',
          type: position.type,
          status: 'FAILED',
          reason: 'Processing error'
        });
        failedCount++;
      }
    }

    console.log(
      `Position opening process completed: ${placedCount} placed, ${failedCount} failed, ${skippedCount} skipped`
    );

    return NextResponse.json({
      message: 'Position opening process completed',
      processed: pendingPositions.length,
      placed: placedCount,
      failed: failedCount,
      skipped: skippedCount,
      results
    });
  } catch (error) {
    console.error('Error in scheduled position opening process:', error);
    return NextResponse.json(
      {
        error: 'Failed to process pending positions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

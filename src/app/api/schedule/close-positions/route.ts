import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  refreshSaveMarkets,
  calculatePositionPnL
} from '@/lib/calculator-server';
import { Market, Position, TransactionType } from '@prisma/client';

/**
 * @swagger
 * /api/schedule/close-positions:
 *   get:
 *     summary: Scheduled endpoint to automatically close positions based on take profit/stop loss
 *     tags: [Schedule, Positions]
 *     responses:
 *       200:
 *         description: Positions processed successfully
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Starting scheduled position closing process...');

    // Get all PLACED positions that have take profit or stop loss set
    const positionsToCheck = await prisma.position.findMany({
      where: {
        status: 'PLACED',
        OR: [{ takeProfit: { not: null } }, { stopLoss: { not: null } }]
      },
      include: {
        user: true,
        market: true
      }
    });

    console.log(`Found ${positionsToCheck.length} positions to check`);

    if (positionsToCheck.length === 0) {
      return NextResponse.json({
        message: 'No positions to check',
        processed: 0,
        closed: 0
      });
    }

    // Get all unique markets to refresh their data
    const marketMap = new Map();
    positionsToCheck.forEach((pos) => {
      if (pos.market) {
        marketMap.set(pos.market.id, pos.market);
      }
    });
    const markets = Array.from(marketMap.values());

    // Refresh market data for all positions
    const refreshedMarkets = await refreshSaveMarkets(markets);
    if (!refreshedMarkets) {
      console.warn('Failed to refresh market data for position checking');
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

    let processedCount = 0;
    let closedCount = 0;
    const closedPositions = [];

    // Check each position for take profit/stop loss conditions
    for (const position of positionsToCheck) {
      try {
        processedCount++;

        if (
          !position.market ||
          !position.executedPrice ||
          !['BUY', 'SELL'].includes(position.type)
        ) {
          console.log(
            `Skipping position ${position.id}: invalid market or type`
          );
          continue;
        }

        const refreshedMarket = marketDataMap.get(position.market.id);
        if (!refreshedMarket) {
          console.log(
            `Skipping position ${position.id}: no refreshed market data`
          );
          continue;
        }

        // Calculate current price based on position type
        const midPrice = refreshedMarket.lastPrice ?? 0;
        const spread = refreshedMarket.spread ?? 0;
        const bidPrice = midPrice - spread / 2;
        const askPrice = midPrice + spread / 2;
        const currentPrice = position.type === 'BUY' ? askPrice : bidPrice;

        console.log(`Checking position ${position.id}:`, {
          type: position.type,
          executedPrice: position.executedPrice,
          currentPrice,
          takeProfit: position.takeProfit,
          stopLoss: position.stopLoss
        });

        let shouldClose = false;
        let closeReason = '';

        // Check take profit and stop loss conditions
        if (position.type === 'BUY') {
          // For BUY positions:
          // Take profit: current price >= take profit price
          // Stop loss: current price <= stop loss price
          if (position.takeProfit && currentPrice >= position.takeProfit) {
            shouldClose = true;
            closeReason = 'Take profit reached';
          } else if (position.stopLoss && currentPrice <= position.stopLoss) {
            shouldClose = true;
            closeReason = 'Stop loss triggered';
          }
        } else if (position.type === 'SELL') {
          // For SELL positions:
          // Take profit: current price <= take profit price
          // Stop loss: current price >= stop loss price
          if (position.takeProfit && currentPrice <= position.takeProfit) {
            shouldClose = true;
            closeReason = 'Take profit reached';
          } else if (position.stopLoss && currentPrice >= position.stopLoss) {
            shouldClose = true;
            closeReason = 'Stop loss triggered';
          }
        }

        if (shouldClose) {
          console.log(`Closing position ${position.id}: ${closeReason}`);

          // Calculate P&L for the position
          const positionWithClosedPrice = {
            ...position,
            closedPrice: currentPrice,
            status: 'CLOSED' as const
          };

          const calculatedPnL = await calculatePositionPnL(
            positionWithClosedPrice as Position & { market: Market }
          );

          // Close the position in a transaction
          const updatedPosition = await prisma.$transaction(async (tx) => {
            // Update the position
            const updatedPosition = await tx.position.update({
              where: { id: position.id },
              data: {
                status: 'CLOSED',
                closedPrice: currentPrice,
                closedAt: new Date(),
                pnl: calculatedPnL || 0
              }
            });

            // Update user balance and create transaction if P&L is calculated
            if (calculatedPnL !== null && calculatedPnL !== 0) {
              const transactionType: TransactionType =
                calculatedPnL > 0 ? 'GAIN' : 'LOSS';
              const absoluteAmount = Math.abs(calculatedPnL);

              // Update user balance
              await tx.user.update({
                where: { id: position.userId },
                data: {
                  balance: {
                    increment: calculatedPnL
                  }
                }
              });

              // Create transaction record
              await tx.transaction.create({
                data: {
                  userId: position.userId,
                  type: transactionType,
                  absoluteAmount: absoluteAmount,
                  description: `Position ${position.type} auto-closed - ${position.market?.symbol || 'Unknown'} (${closeReason})`
                }
              });
            }

            return updatedPosition;
          });

          closedPositions.push({
            id: position.id,
            symbol: position.market.symbol,
            type: position.type,
            reason: closeReason,
            pnl: calculatedPnL
          });

          closedCount++;
        }
      } catch (error) {
        console.error(`Error processing position ${position.id}:`, error);
      }
    }

    console.log(`Scheduled position closing completed:`, {
      processed: processedCount,
      closed: closedCount
    });

    return NextResponse.json({
      message: 'Scheduled position closing completed',
      processed: processedCount,
      closed: closedCount,
      closedPositions
    });
  } catch (error) {
    console.error('Error in scheduled position closing:', error);
    return NextResponse.json(
      { error: 'Failed to process scheduled position closing' },
      { status: 500 }
    );
  }
}

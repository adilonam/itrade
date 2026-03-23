import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  refreshSaveMarkets,
  calculatePositionPnL,
  calculateUserFinancialInfo
} from '@/lib/calculator-server';
import {
  Market,
  Position,
  TransactionType
} from '@/lib/prisma/generated/client';

export async function GET() {
  try {
    // eslint-disable-next-line no-console
    console.log('Starting scheduled position closing process...');

    // Get minimum margin level from environment or use default of 100%
    const MIN_MARGIN_LEVEL = parseFloat(process.env.MIN_MARGIN_LEVEL || '100');

    // Step 1: Check all users with PLACED positions for margin calls
    const usersWithPositions = await prisma.user.findMany({
      where: {
        positions: {
          some: {
            status: 'PLACED'
          }
        }
      }
    });

    let marginCallClosedCount = 0;
    const marginCallClosedUsers = [];

    // Check each user's margin level
    for (const user of usersWithPositions) {
      const financialInfo = await calculateUserFinancialInfo(user);

      if (
        financialInfo &&
        financialInfo.marginLevel !== null &&
        financialInfo.marginLevel < MIN_MARGIN_LEVEL
      ) {
        // eslint-disable-next-line no-console
        console.log(
          `MARGIN CALL: User ${user.email} has margin level ${financialInfo.marginLevel}% (below ${MIN_MARGIN_LEVEL}%)`
        );

        // Get all PLACED positions for this user
        const userPositions = await prisma.position.findMany({
          where: {
            userId: user.id,
            status: 'PLACED'
          },
          include: {
            market: true
          }
        });

        // Close all positions due to margin call
        for (const position of userPositions) {
          try {
            if (
              !position.market ||
              !position.executedPrice ||
              !['BUY', 'SELL'].includes(position.type)
            ) {
              continue;
            }
            const refreshedMarkets = await refreshSaveMarkets([
              position.market
            ]);
            if (!refreshedMarkets) {
              continue;
            }
            // Calculate current price
            const midPrice = refreshedMarkets[0].lastPrice ?? 0;
            const spread = position.market.spread ?? 0;
            const bidPrice = midPrice - spread / 2;
            const askPrice = midPrice + spread / 2;
            const currentPrice = position.type === 'BUY' ? askPrice : bidPrice;

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
            await prisma.$transaction(async (tx) => {
              // Update the position
              await tx.position.update({
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
                await tx.userBalance.upsert({
                  where: { userId_type: { userId: position.userId, type: 'REAL' } },
                  update: { amount: { increment: calculatedPnL } },
                  create: { userId: position.userId, type: 'REAL', amount: calculatedPnL }
                });

                // Create transaction record
                await tx.transaction.create({
                  data: {
                    userId: position.userId,
                    balanceType: 'REAL',
                    type: transactionType,
                    absoluteAmount: absoluteAmount,
                    description: `Position ${position.type} closed by MARGIN CALL - ${position.market?.symbol || 'Unknown'} (Margin Level: ${financialInfo.marginLevel?.toFixed(2)}%)`
                  }
                });
              }
            });

            marginCallClosedCount++;
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error(
              `Error closing position ${position.id} for margin call:`,
              error
            );
          }
        }

        marginCallClosedUsers.push({
          userId: user.id,
          email: user.email,
          marginLevel: financialInfo.marginLevel,
          positionsClosed: userPositions.length
        });
      }
    }

    // Step 2: Check all PLACED positions that have take profit or stop loss set
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

    // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
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
          // eslint-disable-next-line no-console
          console.log(
            `Skipping position ${position.id}: invalid market or type`
          );
          continue;
        }

        const refreshedMarket = marketDataMap.get(position.market.id);
        if (!refreshedMarket) {
          // eslint-disable-next-line no-console
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

        // eslint-disable-next-line no-console
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
          // eslint-disable-next-line no-console
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
          await prisma.$transaction(async (tx) => {
            // Update the position
            await tx.position.update({
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
              await tx.userBalance.upsert({
                where: { userId_type: { userId: position.userId, type: 'REAL' } },
                update: { amount: { increment: calculatedPnL } },
                create: { userId: position.userId, type: 'REAL', amount: calculatedPnL }
              });

              // Create transaction record
              await tx.transaction.create({
                data: {
                  userId: position.userId,
                  balanceType: 'REAL',
                  type: transactionType,
                  absoluteAmount: absoluteAmount,
                  description: `Position ${position.type} auto-closed - ${position.market?.symbol || 'Unknown'} (${closeReason})`
                }
              });
            }
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
        // eslint-disable-next-line no-console
        console.error(`Error processing position ${position.id}:`, error);
      }
    }

    // eslint-disable-next-line no-console
    console.log(`Scheduled position closing completed:`, {
      marginCallClosed: marginCallClosedCount,
      marginCallUsers: marginCallClosedUsers.length,
      processed: processedCount,
      closed: closedCount
    });

    return NextResponse.json({
      message: 'Scheduled position closing completed',
      marginCall: {
        closed: marginCallClosedCount,
        users: marginCallClosedUsers
      },
      takeProfit_StopLoss: {
        processed: processedCount,
        closed: closedCount,
        closedPositions
      }
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in scheduled position closing:', error);
    return NextResponse.json(
      { error: 'Failed to process scheduled position closing' },
      { status: 500 }
    );
  }
}

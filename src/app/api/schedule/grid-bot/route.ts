/* eslint-disable no-console -- Scheduled job logging for serverless observability */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  refreshSaveMarkets,
  calculatePositionPnL,
  couldOpenPosition
} from '@/lib/calculator-server';
import {
  Market,
  Position,
  TransactionType
} from '@/lib/prisma/generated/client';
import {
  ensureUserBalance,
  getBalanceTypeForPositionRoom,
  getUserBalanceAmount
} from '@/lib/balance';

export async function GET() {
  try {
    console.log('Starting Grid Trading bot scheduled run...');

    const now = new Date();

    const botUsers = await prisma.botUser.findMany({
      where: {
        bot: 'GRID_TRADING',
        active: true,
        dateStart: { lte: now },
        dateStop: { gte: now }
      },
      include: {
        user: { select: { id: true, leverage: true } },
        market: true
      }
    });

    console.log(`Found ${botUsers.length} active Grid Trading bot users for current date`);

    if (botUsers.length === 0) {
      return NextResponse.json({
        message: 'No active Grid Trading bots to process',
        processed: 0,
        closed: 0,
        opened: 0,
        results: []
      });
    }

    const results: Array<{
      botUserId: string;
      symbol: string;
      price: number;
      signal: 'BUY' | 'SELL' | null;
      closedPositionId?: string;
      openedPositionId?: string;
      error?: string;
    }> = [];

    let closedCount = 0;
    let openedCount = 0;

    for (const botUser of botUsers) {
      try {
        if (!botUser.market) {
          results.push({
            botUserId: botUser.id,
            symbol: 'Unknown',
            price: 0,
            signal: null,
            error: 'Market not found'
          });
          continue;
        }

        const refreshedMarkets = await refreshSaveMarkets([botUser.market]);
        if (!refreshedMarkets?.length) {
          results.push({
            botUserId: botUser.id,
            symbol: botUser.market.symbol,
            price: 0,
            signal: null,
            error: 'Failed to refresh market'
          });
          continue;
        }

        const market = refreshedMarkets[0];
        const currentPrice = market.lastPrice ?? 0;

        const botParams = (botUser.botParams ?? {}) as Record<string, unknown>;
        const gridBuyLevel = Number(botParams.gridBuyLevel);
        const gridSellLevel = Number(botParams.gridSellLevel);

        if (Number.isNaN(gridBuyLevel) || Number.isNaN(gridSellLevel)) {
          results.push({
            botUserId: botUser.id,
            symbol: botUser.market.symbol,
            price: currentPrice,
            signal: null,
            error: 'Invalid grid levels (gridBuyLevel, gridSellLevel required in botParams)'
          });
          continue;
        }

        let signal: 'BUY' | 'SELL' | null = null;
        if (currentPrice <= gridBuyLevel) {
          signal = 'BUY';
        } else if (currentPrice >= gridSellLevel) {
          signal = 'SELL';
        }

        if (!signal) {
          results.push({
            botUserId: botUser.id,
            symbol: botUser.market.symbol,
            price: currentPrice,
            signal: null
          });
          continue;
        }

        const existingPosition = await prisma.position.findFirst({
          where: {
            userId: botUser.userId,
            marketId: botUser.marketId,
            status: 'PLACED',
            bot: 'GRID_TRADING'
          },
          include: { market: true, user: true }
        });

        let closedPositionId: string | undefined;

        if (existingPosition && existingPosition.market) {
          const refreshedMarketsForClose = await refreshSaveMarkets([
            existingPosition.market
          ]);
          if (!refreshedMarketsForClose?.length) {
            results.push({
              botUserId: botUser.id,
              symbol: botUser.market.symbol,
              price: currentPrice,
              signal,
              error: 'Failed to refresh market for close'
            });
            continue;
          }

          const refreshedMarket = refreshedMarketsForClose[0];
          const midPrice = refreshedMarket.lastPrice ?? 0;
          const spread = refreshedMarket.spread ?? 0;
          const bidPrice = midPrice - spread / 2;
          const askPrice = midPrice + spread / 2;
          const closePrice =
            existingPosition.type === 'BUY' ? askPrice : bidPrice;

          const positionWithClosedPrice = {
            ...existingPosition,
            closedPrice: closePrice,
            status: 'CLOSED' as const
          };

          const calculatedPnL = await calculatePositionPnL(
            positionWithClosedPrice as Position & { market: Market }
          );

          await prisma.$transaction(async (tx) => {
            await tx.position.update({
              where: { id: existingPosition.id },
              data: {
                status: 'CLOSED',
                closedPrice: closePrice,
                closedAt: new Date(),
                pnl: calculatedPnL ?? 0
              }
            });

            if (calculatedPnL !== null && calculatedPnL !== 0) {
              const transactionType: TransactionType =
                calculatedPnL > 0 ? 'GAIN' : 'LOSS';
              await tx.userBalance.update({
                where: { id: existingPosition.userBalanceId },
                data: { amount: { increment: calculatedPnL } }
              });
              await tx.transaction.create({
                data: {
                  userBalanceId: existingPosition.userBalanceId,
                  type: transactionType,
                  absoluteAmount: Math.abs(calculatedPnL),
                  description: `Position ${existingPosition.type} closed by Grid Trading bot - ${existingPosition.market?.symbol ?? 'Unknown'}`
                }
              });
            }
          });

          closedPositionId = existingPosition.id;
          closedCount++;
        }

        const refreshedMarketsForOpen = await refreshSaveMarkets([
          botUser.market
        ]);
        if (!refreshedMarketsForOpen?.length) {
          results.push({
            botUserId: botUser.id,
            symbol: botUser.market.symbol,
            price: currentPrice,
            signal,
            closedPositionId,
            error: 'Failed to refresh market for open'
          });
          continue;
        }

        const marketForOpen = refreshedMarketsForOpen[0];
        const mid = marketForOpen.lastPrice ?? 0;
        const sp = marketForOpen.spread ?? 0;
        const executedPrice = signal === 'BUY' ? mid + sp / 2 : mid - sp / 2;

        const balanceType = getBalanceTypeForPositionRoom(botUser.market.room);
        const { botUserBalanceId, walletBalance } =
          await prisma.$transaction(async (tx) => {
            const ub = await ensureUserBalance(tx, botUser.userId, balanceType);
            const amt = await getUserBalanceAmount(tx, botUser.userId, balanceType);
            return { botUserBalanceId: ub.id, walletBalance: amt };
          });
        const tempPosition = {
          id: 'temp',
          userId: botUser.userId,
          type: signal,
          status: 'PLACED' as const,
          room: botUser.market.room,
          userBalanceId: botUserBalanceId,
          marketId: botUser.marketId,
          quantity: botUser.quantityLot,
          executedPrice,
          closedPrice: null,
          takeProfit: null,
          stopLoss: null,
          description: `Grid Trading bot ${signal} - ${botUser.market.symbol}`,
          executedAt: new Date(),
          closedAt: null,
          pnl: null,
          user: { ...botUser.user, balance: walletBalance },
          market: marketForOpen
        };

        const positionCheck = await couldOpenPosition(tempPosition as any);

        if (!positionCheck?.canOpen) {
          results.push({
            botUserId: botUser.id,
            symbol: botUser.market.symbol,
            price: currentPrice,
            signal,
            closedPositionId,
            error: 'Insufficient margin to open position'
          });
          continue;
        }

        const newPosition = await prisma.position.create({
          data: {
            userId: botUser.userId,
            type: signal,
            status: 'PLACED',
            room: botUser.market.room,
            userBalanceId: botUserBalanceId,
            marketId: botUser.marketId,
            quantity: botUser.quantityLot,
            executedPrice,
            requiredMargin: positionCheck.newPositionRequiredMargin,
            description: `Grid Trading bot ${signal} - ${botUser.market.symbol}`,
            bot: 'GRID_TRADING',
            executedAt: new Date()
          }
        });

        openedCount++;
        results.push({
          botUserId: botUser.id,
          symbol: botUser.market.symbol,
          price: currentPrice,
          signal,
          closedPositionId,
          openedPositionId: newPosition.id
        });
      } catch (err) {
        console.error(`Error processing Grid Trading bot ${botUser.id}:`, err);
        results.push({
          botUserId: botUser.id,
          symbol: botUser.market?.symbol ?? 'Unknown',
          price: 0,
          signal: null,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    console.log(
      `Grid Trading bot run completed: ${closedCount} closed, ${openedCount} opened`
    );

    return NextResponse.json({
      message: 'Grid Trading bot run completed',
      processed: botUsers.length,
      closed: closedCount,
      opened: openedCount,
      results
    });
  } catch (error) {
    console.error('Error in Grid Trading bot scheduled run:', error);
    return NextResponse.json(
      {
        error: 'Failed to run Grid Trading bot',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

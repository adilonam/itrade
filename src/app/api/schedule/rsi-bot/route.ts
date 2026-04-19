/* eslint-disable no-console -- Scheduled job logging for serverless observability */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  refreshSaveMarkets,
  calculatePositionPnL,
  couldOpenPosition
} from '@/lib/calculator-server';
import { twelveDataService } from '@/lib/twelvedata';
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

const DEFAULT_RSI_OVERSOLD = 30;
const DEFAULT_RSI_OVERBOUGHT = 70;

export async function GET() {
  try {
    console.log('Starting RSI bot scheduled run...');

    const now = new Date();

    const botUsers = await prisma.botUser.findMany({
      where: {
        bot: 'RSI',
        active: true,
        dateStart: { lte: now },
        dateStop: { gte: now }
      },
      include: {
        user: { select: { id: true, leverage: true } },
        market: true
      }
    });

    console.log(`Found ${botUsers.length} active RSI bot users for current date`);

    if (botUsers.length === 0) {
      return NextResponse.json({
        message: 'No active RSI bots to process',
        processed: 0,
        closed: 0,
        opened: 0,
        results: []
      });
    }

    const results: Array<{
      botUserId: string;
      symbol: string;
      rsi: number;
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
            rsi: 0,
            signal: null,
            error: 'Market not found'
          });
          continue;
        }

        const rsiResult = await twelveDataService.getRsi(
          botUser.market.symbol,
          botUser.interval
        );

       

        if ('error' in rsiResult) {
          results.push({
            botUserId: botUser.id,
            symbol: botUser.market.symbol,
            rsi: 0,
            signal: null,
            error: rsiResult.message ?? rsiResult.error
          });
          continue;
        }

        const rsi = rsiResult.rsi;
        const botParams = (botUser.botParams ?? {}) as Record<string, unknown>;
        const rsiOversold = Number(botParams.rsiOversold) || DEFAULT_RSI_OVERSOLD;
        const rsiOverbought = Number(botParams.rsiOverbought) || DEFAULT_RSI_OVERBOUGHT;

        let signal: 'BUY' | 'SELL' | null = null;
        if (rsi <= rsiOversold) {
          signal = 'BUY';
        } else if (rsi >= rsiOverbought) {
          signal = 'SELL';
        }

        if (!signal) {
          results.push({
            botUserId: botUser.id,
            symbol: botUser.market.symbol,
            rsi,
            signal: null
          });
          continue;
        }

        const existingPosition = await prisma.position.findFirst({
          where: {
            userId: botUser.userId,
            marketId: botUser.marketId,
            status: 'PLACED',
            bot: 'RSI'
          },
          include: { market: true, user: true }
        });

        let closedPositionId: string | undefined;

        if (existingPosition && existingPosition.market) {
          const refreshedMarkets = await refreshSaveMarkets([
            existingPosition.market
          ]);
          if (!refreshedMarkets?.length) {
            results.push({
              botUserId: botUser.id,
              symbol: botUser.market.symbol,
              rsi,
              signal,
              error: 'Failed to refresh market for close'
            });
            continue;
          }

          const refreshedMarket = refreshedMarkets[0];
          const midPrice = refreshedMarket.lastPrice ?? 0;
          const spread = refreshedMarket.spread ?? 0;
          const bidPrice = midPrice - spread / 2;
          const askPrice = midPrice + spread / 2;
          const currentPrice =
            existingPosition.type === 'BUY' ? askPrice : bidPrice;

          const positionWithClosedPrice = {
            ...existingPosition,
            closedPrice: currentPrice,
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
                closedPrice: currentPrice,
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
                  description: `Position ${existingPosition.type} closed by RSI bot - ${existingPosition.market?.symbol ?? 'Unknown'}`
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
            rsi,
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
          description: `RSI bot ${signal} - ${botUser.market.symbol}`,
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
            rsi,
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
            description: `RSI bot ${signal} - ${botUser.market.symbol}`,
            bot: 'RSI',
            executedAt: new Date()
          }
        });

        openedCount++;
        results.push({
          botUserId: botUser.id,
          symbol: botUser.market.symbol,
          rsi,
          signal,
          closedPositionId,
          openedPositionId: newPosition.id
        });
      } catch (err) {
        console.error(`Error processing RSI bot ${botUser.id}:`, err);
        results.push({
          botUserId: botUser.id,
          symbol: botUser.market?.symbol ?? 'Unknown',
          rsi: 0,
          signal: null,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    console.log(
      `RSI bot run completed: ${closedCount} closed, ${openedCount} opened`
    );

    return NextResponse.json({
      message: 'RSI bot run completed',
      processed: botUsers.length,
      closed: closedCount,
      opened: openedCount,
      results
    });
  } catch (error) {
    console.error('Error in RSI bot scheduled run:', error);
    return NextResponse.json(
      {
        error: 'Failed to run RSI bot',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

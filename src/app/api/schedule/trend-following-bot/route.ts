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
import { getUserBalanceAmount } from '@/lib/balance';

const DEFAULT_EMA_FAST_PERIOD = 9;
const DEFAULT_EMA_SLOW_PERIOD = 21;

export async function GET() {
  try {
    console.log('Starting Trend Following bot scheduled run...');

    const now = new Date();

    const botUsers = await prisma.botUser.findMany({
      where: {
        bot: 'TREND_FOLLOWING',
        active: true,
        dateStart: { lte: now },
        dateStop: { gte: now }
      },
      include: {
        user: { select: { id: true, leverage: true } },
        market: true
      }
    });

    console.log(`Found ${botUsers.length} active Trend Following bot users for current date`);

    if (botUsers.length === 0) {
      return NextResponse.json({
        message: 'No active Trend Following bots to process',
        processed: 0,
        closed: 0,
        opened: 0,
        results: []
      });
    }

    const results: Array<{
      botUserId: string;
      symbol: string;
      emaFast: number;
      emaSlow: number;
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
            emaFast: 0,
            emaSlow: 0,
            signal: null,
            error: 'Market not found'
          });
          continue;
        }

        const botParams = (botUser.botParams ?? {}) as Record<string, unknown>;
        const emaFastPeriod = Number(botParams.emaFastPeriod) || DEFAULT_EMA_FAST_PERIOD;
        const emaSlowPeriod = Number(botParams.emaSlowPeriod) || DEFAULT_EMA_SLOW_PERIOD;

        const [emaFastResult, emaSlowResult] = await Promise.all([
          twelveDataService.getEma(
            botUser.market.symbol,
            botUser.interval,
            emaFastPeriod
          ),
          twelveDataService.getEma(
            botUser.market.symbol,
            botUser.interval,
            emaSlowPeriod
          )
        ]);

        if ('error' in emaFastResult) {
          results.push({
            botUserId: botUser.id,
            symbol: botUser.market.symbol,
            emaFast: 0,
            emaSlow: 0,
            signal: null,
            error: emaFastResult.message ?? emaFastResult.error
          });
          continue;
        }

        if ('error' in emaSlowResult) {
          results.push({
            botUserId: botUser.id,
            symbol: botUser.market.symbol,
            emaFast: emaFastResult.ema,
            emaSlow: 0,
            signal: null,
            error: emaSlowResult.message ?? emaSlowResult.error
          });
          continue;
        }

        const emaFast = emaFastResult.ema;
        const emaSlow = emaSlowResult.ema;

        let signal: 'BUY' | 'SELL' | null = null;
        if (emaFast > emaSlow) {
          signal = 'BUY';
        } else if (emaFast < emaSlow) {
          signal = 'SELL';
        }

        if (!signal) {
          results.push({
            botUserId: botUser.id,
            symbol: botUser.market.symbol,
            emaFast,
            emaSlow,
            signal: null
          });
          continue;
        }

        const existingPosition = await prisma.position.findFirst({
          where: {
            userId: botUser.userId,
            marketId: botUser.marketId,
            status: 'PLACED',
            bot: 'TREND_FOLLOWING'
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
              emaFast,
              emaSlow,
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
              await tx.userBalance.upsert({
                where: {
                  userId_type: { userId: existingPosition.userId, type: 'REAL' }
                },
                update: { amount: { increment: calculatedPnL } },
                create: {
                  userId: existingPosition.userId,
                  type: 'REAL',
                  amount: calculatedPnL
                }
              });
              await tx.transaction.create({
                data: {
                  userId: existingPosition.userId,
                  balanceType: 'REAL',
                  type: transactionType,
                  absoluteAmount: Math.abs(calculatedPnL),
                  description: `Position ${existingPosition.type} closed by Trend Following bot - ${existingPosition.market?.symbol ?? 'Unknown'}`
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
            emaFast,
            emaSlow,
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

        const realBalance = await prisma.$transaction((tx) =>
          getUserBalanceAmount(tx, botUser.userId, 'REAL')
        );
        const tempPosition = {
          id: 'temp',
          userId: botUser.userId,
          type: signal,
          status: 'PLACED' as const,
          room: botUser.market.room,
          marketId: botUser.marketId,
          quantity: botUser.quantityLot,
          executedPrice,
          closedPrice: null,
          takeProfit: null,
          stopLoss: null,
          description: `Trend Following bot ${signal} - ${botUser.market.symbol}`,
          executedAt: new Date(),
          closedAt: null,
          pnl: null,
          user: { ...botUser.user, balance: realBalance },
          market: marketForOpen
        };

        const positionCheck = await couldOpenPosition(tempPosition as any);

        if (!positionCheck?.canOpen) {
          results.push({
            botUserId: botUser.id,
            symbol: botUser.market.symbol,
            emaFast,
            emaSlow,
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
            marketId: botUser.marketId,
            quantity: botUser.quantityLot,
            executedPrice,
            requiredMargin: positionCheck.newPositionRequiredMargin,
            description: `Trend Following bot ${signal} - ${botUser.market.symbol}`,
            bot: 'TREND_FOLLOWING',
            executedAt: new Date()
          }
        });

        openedCount++;
        results.push({
          botUserId: botUser.id,
          symbol: botUser.market.symbol,
          emaFast,
          emaSlow,
          signal,
          closedPositionId,
          openedPositionId: newPosition.id
        });
      } catch (err) {
        console.error(`Error processing Trend Following bot ${botUser.id}:`, err);
        results.push({
          botUserId: botUser.id,
          symbol: botUser.market?.symbol ?? 'Unknown',
          emaFast: 0,
          emaSlow: 0,
          signal: null,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    console.log(
      `Trend Following bot run completed: ${closedCount} closed, ${openedCount} opened`
    );

    return NextResponse.json({
      message: 'Trend Following bot run completed',
      processed: botUsers.length,
      closed: closedCount,
      opened: openedCount,
      results
    });
  } catch (error) {
    console.error('Error in Trend Following bot scheduled run:', error);
    return NextResponse.json(
      {
        error: 'Failed to run Trend Following bot',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

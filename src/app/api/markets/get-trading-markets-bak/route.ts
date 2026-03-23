import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { twelveDataService } from '@/lib/twelvedata';

export async function GET() {
  try {
    // Get only visible markets with TRADING room from database
    const markets = await prisma.market.findMany({
      where: {
        visible: true,
        room: 'TRADING'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Update lastPrice and lastChange for each market using TwelveData
    const updatedMarkets = await Promise.all(
      markets.map(async (market) => {
        try {
          const marketData = await twelveDataService.getCombinedData(
            market.symbol
          );

          if ('error' in marketData) {
            // If API fails, return market with existing data
            return market;
          }

          const lastPrice = parseFloat(
            marketData.current_price ?? marketData.close ?? '0'
          );
          const lastChange = parseFloat(marketData.change ?? '0');

          // Update the market in database
          const updatedMarket = await prisma.market.update({
            where: { id: market.id },
            data: {
              lastPrice: isFinite(lastPrice) ? lastPrice : market.lastPrice,
              lastChange: isFinite(lastChange) ? lastChange : market.lastChange,
              updatedAt: new Date()
            }
          });

          return updatedMarket;
        } catch (error) {
          // If update fails, return original market
          return market;
        }
      })
    );

    return NextResponse.json({ markets: updatedMarkets }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch trading markets',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { twelveDataService } from '@/lib/twelvedata';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const room = searchParams.get('room')?.toUpperCase() || 'ALL';

    // Validate room parameter
    const validRooms = ['STOCK', 'TRADING', 'INSTITUTIONAL'];
    if (!validRooms.includes(room)) {
      return NextResponse.json(
        {
          error: 'Invalid room parameter',
          message: `Room must be one of: ${validRooms.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Build where clause based on room parameter
    const whereClause: any = {
      visible: true
    };

    if (room === 'STOCK') {
      whereClause.room = 'STOCK';
    } else if (room === 'TRADING') {
      whereClause.room = 'TRADING';
    } else if (room === 'INSTITUTIONAL') {
      whereClause.room = 'INSTITUTIONAL';
    }
    // For 'ALL', we just use visible: true

    // Get markets from database
    const markets = await prisma.market.findMany({
      where: whereClause,
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
          const lastPercentChange = parseFloat(
            marketData.percent_change ?? '0'
          );
          const lastPreviousClose = parseFloat(
            marketData.previous_close ?? '0'
          );

          // Update the market in database
          const updatedMarket = await prisma.market.update({
            where: { id: market.id },
            data: {
              lastPrice: isFinite(lastPrice) ? lastPrice : market.lastPrice,
              lastChange: isFinite(lastChange) ? lastChange : market.lastChange,
              lastPercentChange: isFinite(lastPercentChange)
                ? lastPercentChange
                : market.lastPercentChange,
              lastPreviousClose: isFinite(lastPreviousClose)
                ? lastPreviousClose
                : market.lastPreviousClose,
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
        error: 'Failed to fetch markets',
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

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

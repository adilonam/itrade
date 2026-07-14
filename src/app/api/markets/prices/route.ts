import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { twelveDataService } from '@/lib/twelvedata';
import type { TwelveDataRestPricePayload } from '@/types/twelvedata';

const SYMBOL_PATTERN = /^[A-Z0-9./-]{1,12}$/i;

function parseSymbolsParam(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return Array.from(
    new Set(raw.split(',').map((s) => s.trim().toUpperCase()))
  ).filter((symbol) => SYMBOL_PATTERN.test(symbol));
}

export async function GET(request: NextRequest) {
  try {
    const symbols = parseSymbolsParam(request.nextUrl.searchParams.get('symbols'));

    if (symbols.length === 0) {
      return NextResponse.json(
        {
          error: 'Symbols parameter is required',
          message: 'Example: ?symbols=AAPL,EUR/USD'
        },
        { status: 400 }
      );
    }

    const livePrices = await twelveDataService.getPricesForSymbols(symbols);
    const prices: Record<string, TwelveDataRestPricePayload> = {};

    await Promise.all(
      Object.entries(livePrices).map(async ([symbol, payload]) => {
        if (!payload) return;

        prices[symbol] = payload;

        try {
          const market = await prisma.market.findFirst({
            where: { symbol }
          });
          if (!market) return;

          await prisma.market.update({
            where: { id: market.id },
            data: {
              lastPrice: payload.price,
              updatedAt: new Date()
            }
          });
        } catch {
          // Keep the live price even if DB update fails.
        }
      })
    );

    return NextResponse.json(
      { prices },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch market prices',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

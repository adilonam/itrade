import { landingMarketTapeSymbols } from '@/constants/data';
import { twelveDataService } from '@/lib/twelvedata';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function parseSymbolsParam(raw: string | null): string[] {
  if (!raw?.trim()) {
    return [...landingMarketTapeSymbols];
  }
  return Array.from(new Set(raw.split(',').map((s) => s.trim().toUpperCase()))).filter(Boolean);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbols = parseSymbolsParam(searchParams.get('symbols'));

    const quotes = await twelveDataService.getQuotesForTape(symbols);

    return NextResponse.json(
      { quotes },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch {
    return NextResponse.json({ quotes: {} }, { status: 500 });
  }
}

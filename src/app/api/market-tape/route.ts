import {
  landingMarketTapeDefaultQuotes,
  landingMarketTapeSymbols
} from '@/constants/data';
import { twelveDataService } from '@/lib/twelvedata';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function parseSymbolsParam(raw: string | null): string[] {
  if (!raw?.trim()) {
    return [...landingMarketTapeSymbols];
  }
  return Array.from(new Set(raw.split(',').map((s) => s.trim().toUpperCase()))).filter(Boolean);
}

type TapeQuote = { price: number; percentChange: number };

function buildDefaultQuotes(symbols: string[]): Record<string, TapeQuote> {
  const defaults: Record<string, TapeQuote> = {};
  for (const symbol of symbols) {
    defaults[symbol] = landingMarketTapeDefaultQuotes[symbol as keyof typeof landingMarketTapeDefaultQuotes] ?? {
      price: 100,
      percentChange: 0
    };
  }
  return defaults;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = parseSymbolsParam(searchParams.get('symbols'));
  const defaultQuotes = buildDefaultQuotes(symbols);

  try {
    const liveQuotes = await twelveDataService.getQuotesForTape(symbols);
    const quotes = { ...defaultQuotes, ...liveQuotes };

    return NextResponse.json(
      { quotes },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch {
    return NextResponse.json(
      { quotes: defaultQuotes },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}

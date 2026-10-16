import {
  landingIcWidgetDefaultQuotes,
  landingIcWidgetSymbols
} from '@/constants/data';
import { twelveDataService } from '@/lib/twelvedata';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type WidgetQuote = { bid: number; ask: number; percentChange: number };

function buildDefaultQuotes(): Record<string, WidgetQuote> {
  return { ...landingIcWidgetDefaultQuotes };
}

export async function GET() {
  const defaultQuotes = buildDefaultQuotes();

  try {
    const liveQuotes = await twelveDataService.getQuotesForLandingWidget(
      landingIcWidgetSymbols
    );
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

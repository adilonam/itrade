import { getAuthSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const key = process.env.ALPHA_VANTAGE_API_KEY?.trim();
    if (!key) {
      return NextResponse.json(
        { error: 'Alpha Vantage API key not configured' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ?? '50';
    const tickers = searchParams.get('tickers') ?? '';
    const sort = searchParams.get('sort') ?? 'LATEST';

    const params = new URLSearchParams({
      function: 'NEWS_SENTIMENT',
      apikey: key,
      limit,
      sort
    });
    if (tickers) params.set('tickers', tickers);

    const res = await fetch(`${ALPHA_VANTAGE_BASE}?${params.toString()}`, {
      next: { revalidate: 300 }
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Alpha Vantage request failed' },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (data['Note'] || data['Information']) {
      return NextResponse.json(
        {
          error:
            data['Note'] ?? data['Information'] ?? 'Rate limit or API message'
        },
        { status: 429 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

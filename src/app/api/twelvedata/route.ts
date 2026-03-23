import { NextRequest, NextResponse } from 'next/server';
import { twelveDataService } from '@/lib/twelvedata';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required. Example: ?symbol=AAPL' },
        { status: 400 }
      );
    }

    // Validate symbol format (basic validation)
    if (!/^[A-Z0-9\.\/\-]{1,12}$/i.test(symbol)) {
      return NextResponse.json(
        {
          error:
            'Invalid symbol format. Symbol should contain only alphanumeric characters, dots, slashes, or hyphens (e.g., AAPL, EURUSD, BTC-USD).'
        },
        { status: 400 }
      );
    }

    const marketData = await twelveDataService.getCombinedData(
      symbol.toUpperCase()
    );

    // Check if response contains an error
    if ('error' in marketData) {
      return NextResponse.json(marketData, { status: 500 });
    }

    return NextResponse.json(marketData, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
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

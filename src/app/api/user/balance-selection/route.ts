import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthSession } from '@/lib/auth';
import {
  TRADE_BALANCE_COOKIE,
  parseTradeBalanceType,
  type TradeBalanceType
} from '@/lib/balance-selection';

const BalanceSelectionSchema = z.object({
  balanceType: z.enum(['REAL', 'DEMO'])
});

async function sendBalanceSelectionWebhook(payload: {
  userId: string;
  userEmail: string | null;
  balanceType: TradeBalanceType;
  room: 'TRADING';
  occurredAt: string;
}) {
  const webhookUrl = process.env.BALANCE_SELECTION_WEBHOOK_URL;
  if (!webhookUrl) return;

  const webhookSecret = process.env.BALANCE_SELECTION_WEBHOOK_SECRET;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(webhookSecret
          ? { 'x-balance-selection-webhook-secret': webhookSecret }
          : {})
      },
      body: JSON.stringify({
        event: 'user.balance_selection.changed',
        ...payload
      })
    });
  } catch {
    // Best effort only.
  }
}

export async function GET(request: NextRequest) {
  const cookieValue = request.cookies.get(TRADE_BALANCE_COOKIE)?.value;
  const balanceType = parseTradeBalanceType(cookieValue);
  return NextResponse.json({ balanceType });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = BalanceSelectionSchema.parse(body);
    const balanceType = parseTradeBalanceType(validatedData.balanceType);

    const response = NextResponse.json({ balanceType });
    response.cookies.set({
      name: TRADE_BALANCE_COOKIE,
      value: balanceType,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365
    });

    void sendBalanceSelectionWebhook({
      userId: session.user.id,
      userEmail: session.user.email ?? null,
      balanceType,
      room: 'TRADING',
      occurredAt: new Date().toISOString()
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to persist balance selection' },
      { status: 500 }
    );
  }
}

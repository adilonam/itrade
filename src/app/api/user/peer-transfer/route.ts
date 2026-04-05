import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureUserBalance, parseBalanceType } from '@/lib/balance';
import { getAuthSession } from '@/lib/auth';

function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const t = raw.trim().toLowerCase();
  return t.length > 0 ? t : null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = normalizeEmail(
      request.nextUrl.searchParams.get('email') ?? ''
    );
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true }
    });
    const myEmail = me?.email?.trim().toLowerCase();
    if (myEmail && email === myEmail) {
      return NextResponse.json(
        { error: 'You cannot transfer to your own email' },
        { status: 400 }
      );
    }

    const recipient = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true, name: true, email: true }
    });

    if (!recipient) {
      return NextResponse.json({ error: 'No user found with this email' }, { status: 404 });
    }

    if (recipient.id === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot transfer to yourself' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      recipient: {
        id: recipient.id,
        name: recipient.name,
        email: recipient.email
      }
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to look up recipient' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const amountRaw = Number(body?.amount);
    const amount = Number.isFinite(amountRaw) ? amountRaw : 0;
    const balanceType = parseBalanceType(body?.balanceType);
    const recipientEmail = normalizeEmail(body?.recipientEmail);

    if (balanceType !== 'REAL') {
      return NextResponse.json(
        { error: 'Peer transfers are only supported for the real balance.' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Amount must be greater than 0.' },
        { status: 400 }
      );
    }

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Recipient email is required' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const senderRow = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true, name: true }
      });
      if (!senderRow) {
        return { ok: false as const, code: 'NOT_FOUND' as const };
      }

      const senderEmailLower = senderRow.email?.trim().toLowerCase() ?? '';
      if (recipientEmail === senderEmailLower) {
        return { ok: false as const, code: 'SELF' as const };
      }

      const recipientUser = await tx.user.findFirst({
        where: { email: { equals: recipientEmail, mode: 'insensitive' } },
        select: { id: true, email: true, name: true }
      });

      if (!recipientUser) {
        return { ok: false as const, code: 'RECIPIENT_NOT_FOUND' as const };
      }

      if (recipientUser.id === session.user.id) {
        return { ok: false as const, code: 'SELF' as const };
      }

      const senderBalance = await ensureUserBalance(
        tx,
        session.user.id,
        balanceType
      );
      const recipientBalance = await ensureUserBalance(
        tx,
        recipientUser.id,
        balanceType
      );

      const transferRequest = await tx.transferRequest.create({
        data: {
          senderUserBalanceId: senderBalance.id,
          recipientUserBalanceId: recipientBalance.id,
          amount,
          status: 'PENDING'
        }
      });

      return {
        ok: true as const,
        transferRequestId: transferRequest.id,
        recipient: {
          id: recipientUser.id,
          email: recipientUser.email,
          name: recipientUser.name
        }
      };
    });

    if (!result.ok) {
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      if (result.code === 'SELF') {
        return NextResponse.json(
          { error: 'You cannot transfer to yourself' },
          { status: 400 }
        );
      }
      if (result.code === 'RECIPIENT_NOT_FOUND') {
        return NextResponse.json(
          { error: 'No user found with this email' },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: 'Unable to create transfer request' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Transfer request created',
      transferRequestId: result.transferRequestId,
      recipient: result.recipient
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to transfer balance' },
      { status: 500 }
    );
  }
}

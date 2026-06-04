import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import {
  DepositRequestStatus,
  TransactionType
} from '@/lib/prisma/generated/client';
type NowPaymentsWebhookPayload = {
  payment_id?: string | number;
  payment_status?: string;
  order_id?: string;
};

function mapNowPaymentStatus(statusRaw?: string): DepositRequestStatus {
  const status = statusRaw?.toLowerCase();
  switch (status) {
    case 'finished':
    case 'confirmed':
      return DepositRequestStatus.FINISHED;
    case 'partially_paid':
    case 'sending':
    case 'waiting':
      return DepositRequestStatus.CONFIRMING;
    case 'failed':
      return DepositRequestStatus.FAILED;
    case 'expired':
      return DepositRequestStatus.EXPIRED;
    case 'refunded':
      return DepositRequestStatus.REFUNDED;
    default:
      return DepositRequestStatus.WAITING;
  }
}

function shouldCreditDeposit(statusRaw?: string): boolean {
  const status = statusRaw?.toLowerCase();
  return status === 'finished' || status === 'confirmed';
}

function safeEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export async function POST(request: NextRequest) {
  const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET?.trim();
  if (!ipnSecret) {
    return NextResponse.json(
      { error: 'NOWPayments webhook secret is not configured.' },
      { status: 500 }
    );
  }

  const signature = request.headers.get('x-nowpayments-sig');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature.' }, { status: 401 });
  }

  const rawBody = await request.text();
  const expectedSignature = crypto
    .createHmac('sha512', ipnSecret)
    .update(rawBody)
    .digest('hex');

  if (!safeEquals(signature, expectedSignature)) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  let payload: NowPaymentsWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as NowPaymentsWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const nowPaymentId = payload.payment_id ? String(payload.payment_id) : null;
  const orderId = payload.order_id;
  const nowPaymentStatus = payload.payment_status ?? 'unknown';

  if (!nowPaymentId && !orderId) {
    return NextResponse.json(
      { error: 'Missing payment and order identifiers.' },
      { status: 400 }
    );
  }

  const depositRequest = await prisma.depositRequest.findFirst({
    where: {
      OR: [
        ...(nowPaymentId ? [{ nowPaymentId }] : []),
        ...(orderId ? [{ orderId }] : [])
      ]
    },
    include: {
      userBalance: { select: { id: true, userId: true, type: true } }
    }
  });

  if (!depositRequest) {
    return NextResponse.json({ error: 'Deposit request not found.' }, { status: 404 });
  }

  const nextStatus = mapNowPaymentStatus(nowPaymentStatus);

  await prisma.$transaction(async (tx) => {
    const current = await tx.depositRequest.findUnique({
      where: { id: depositRequest.id },
      include: {
        userBalance: { select: { id: true, userId: true, type: true, amount: true } }
      }
    });

    if (!current) return;

    const willCredit = shouldCreditDeposit(nowPaymentStatus) && !current.creditedAt;

    if (willCredit) {
      const ub = current.userBalance;
      await tx.userBalance.update({
        where: { id: ub.id },
        data: {
          amount: ub.amount + current.amountUsd
        }
      });

      await tx.transaction.create({
        data: {
          userBalanceId: ub.id,
          type: TransactionType.DEPOSIT,
          absoluteAmount: current.amountUsd,
          description: `NOWPayments deposit (${current.payCurrency.toUpperCase()}) payment ${nowPaymentId ?? current.nowPaymentId ?? 'n/a'}`
        }
      });
    }

    await tx.depositRequest.update({
      where: { id: current.id },
      data: {
        status: nextStatus,
        nowPaymentId: nowPaymentId ?? current.nowPaymentId,
        nowPaymentStatus,
        lastWebhookAt: new Date(),
        rawWebhookPayload: payload,
        creditedAt: willCredit ? new Date() : current.creditedAt
      }
    });
  });

  return NextResponse.json({ success: true });
}

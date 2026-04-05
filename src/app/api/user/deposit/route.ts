import { getAppSettingsRow } from '@/lib/app-settings';
import { getAuthSession } from '@/lib/auth';
import { ensureUserBalance, parseBalanceType } from '@/lib/balance';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import {
  DepositRequestChannel,
  DepositRequestStatus
} from '@/lib/prisma/generated/client';
import { externalApiLinks } from '@/constants/data';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, paymentMethod, balanceType: rawBalanceType } = body;
    const balanceType = parseBalanceType(rawBalanceType);

    if (balanceType !== 'REAL') {
      return NextResponse.json(
        { error: 'Deposits are only supported for the real balance.' },
        { status: 400 }
      );
    }

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Amount must be greater than 0.' },
        { status: 400 }
      );
    }

    const allowedMethods = ['btc', 'usdc', 'usdt'] as const;
    if (!paymentMethod || !allowedMethods.includes(paymentMethod)) {
      return NextResponse.json(
        {
          error:
            'Invalid payment method. Must be "btc", "usdc", or "usdt".'
        },
        { status: 400 }
      );
    }

    const appSettings = await getAppSettingsRow();
    const nowPaymentsApiKey = appSettings?.nowpaymentsApiKey?.trim();
    if (!nowPaymentsApiKey) {
      return NextResponse.json(
        { error: 'NOWPayments is not configured on the server.' },
        { status: 500 }
      );
    }

    const payCurrency = paymentMethod.toLowerCase();
    const baseUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;
    const orderId = `dep_${session.user.id}_${Date.now()}`;

    const userBalance = await ensureUserBalance(
      prisma,
      session.user.id,
      balanceType
    );

    const depositRequest = await prisma.depositRequest.create({
      data: {
        userBalanceId: userBalance.id,
        amountUsd: amount,
        payCurrency,
        channel: DepositRequestChannel.GATEWAY,
        status: DepositRequestStatus.PENDING,
        orderId
      }
    });

    const invoiceRes = await fetch(externalApiLinks.nowPaymentsInvoiceApi, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': nowPaymentsApiKey
      },
      body: JSON.stringify({
        price_amount: Number(amount.toFixed(2)),
        price_currency: 'usd',
        pay_currency: payCurrency,
        ipn_callback_url: `${baseUrl}/api/webhooks/nowpayments`,
        order_id: orderId,
        order_description: `Deposit for user ${session.user.id}`,
        success_url: `${baseUrl}/user-management/deposit?status=success`,
        cancel_url: `${baseUrl}/user-management/deposit?status=cancelled`
      })
    });

    const invoiceData = (await invoiceRes.json()) as {
      id?: string | number;
      invoice_url?: string;
      status?: string;
      message?: string;
    };

    if (!invoiceRes.ok || !invoiceData.invoice_url) {
      await prisma.depositRequest.update({
        where: { id: depositRequest.id },
        data: {
          status: DepositRequestStatus.FAILED,
          nowPaymentStatus: invoiceData.status ?? 'invoice_creation_failed'
        }
      });

      return NextResponse.json(
        {
          error: invoiceData.message ?? 'Failed to create NOWPayments invoice.'
        },
        { status: 502 }
      );
    }

    await prisma.depositRequest.update({
      where: { id: depositRequest.id },
      data: {
        status: DepositRequestStatus.WAITING,
        nowPaymentId: invoiceData.id ? String(invoiceData.id) : null,
        nowPaymentStatus: invoiceData.status ?? 'waiting',
        checkoutUrl: invoiceData.invoice_url
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Deposit request created. Continue payment in gateway.',
      checkoutUrl: invoiceData.invoice_url,
      balanceType,
      newBalance: 0
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to process deposit' },
      { status: 500 }
    );
  }
}

import { getAppSettingsRow } from '@/lib/app-settings';
import { getAuthSession } from '@/lib/auth';
import { ensureUserBalance, parseBalanceType } from '@/lib/balance';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import {
  DepositRequestChannel,
  DepositRequestStatus
} from '@/lib/prisma/generated/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, balanceType: rawBalanceType } = body;
    const balanceType = parseBalanceType(rawBalanceType);

    if (balanceType !== 'REAL') {
      return NextResponse.json(
        { error: 'Manual deposits are only supported for the real balance.' },
        { status: 400 }
      );
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Amount must be greater than 0.' },
        { status: 400 }
      );
    }

    const settingsRow = await getAppSettingsRow();
    const walletAddress =
      settingsRow?.manualUsdtDepositWalletAddress?.trim() ?? '';
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Manual USDT deposits are not configured on the server.' },
        { status: 503 }
      );
    }

    const orderId = `dep_manual_${session.user.id}_${Date.now()}`;
    const userBalance = await ensureUserBalance(
      prisma,
      session.user.id,
      balanceType
    );

    const depositRequest = await prisma.depositRequest.create({
      data: {
        userBalanceId: userBalance.id,
        amountUsd: amount,
        payCurrency: 'usdt',
        channel: DepositRequestChannel.MANUAL,
        status: DepositRequestStatus.WAITING,
        orderId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Deposit request created. Send USDT to the address below.',
      depositRequestId: depositRequest.id,
      orderId: depositRequest.orderId,
      walletAddress,
      amountUsd: depositRequest.amountUsd,
      payCurrency: 'USDT',
      balanceType
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create manual deposit request' },
      { status: 500 }
    );
  }
}

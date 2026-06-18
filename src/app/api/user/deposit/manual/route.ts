import { getAuthSession } from '@/lib/auth';
import {
  formatManualUsdtPayCurrency,
  getManualUsdtDepositNetwork,
  isManualUsdtDepositNetworkId,
  usdAmountToManualUsdtAmount
} from '@/lib/manual-usdt-deposit';
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
    const { amount, balanceType: rawBalanceType, network: rawNetwork } = body;
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

    if (
      typeof rawNetwork !== 'string' ||
      !isManualUsdtDepositNetworkId(rawNetwork)
    ) {
      return NextResponse.json(
        { error: 'Invalid network. Choose TRC20, ERC20, or BNB.' },
        { status: 400 }
      );
    }

    const network = getManualUsdtDepositNetwork(rawNetwork);
    const usdtAmount = usdAmountToManualUsdtAmount(amount);

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
        payCurrency: formatManualUsdtPayCurrency(rawNetwork),
        channel: DepositRequestChannel.MANUAL,
        status: DepositRequestStatus.WAITING,
        orderId,
        adminNotes: `Send ${usdtAmount.toFixed(2)} USDT on ${network.label}`
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Deposit request created. Send USDT to the address below.',
      depositRequestId: depositRequest.id,
      orderId: depositRequest.orderId,
      network: rawNetwork,
      networkLabel: network.label,
      walletAddress: network.address,
      amountUsd: depositRequest.amountUsd,
      usdtAmount,
      payCurrency: depositRequest.payCurrency,
      balanceType
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create manual deposit request' },
      { status: 500 }
    );
  }
}

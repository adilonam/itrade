import { put } from '@vercel/blob';
import { invalidateAppSettingsCache } from '@/lib/app-settings';
import { getBlobPutOptions } from '@/lib/blob-upload';
import { getAuthSession } from '@/lib/auth';
import type { Prisma } from '@/lib/prisma/generated/client';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ROLES = ['ADMIN', 'SUPERADMIN'];

function isAllowed(role: string | undefined) {
  return !!role && ALLOWED_ROLES.includes(role);
}

function strOrNull(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t.length === 0 ? null : t;
}

export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session || !isAllowed(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const settings = await prisma.appSettings.findUnique({
      where: { id: 'default' }
    });

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session || !isAllowed(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const data: Prisma.AppSettingsUpdateInput = {};

    const appName = strOrNull(body.appName);
    if (appName !== undefined) {
      if (appName === null) {
        return NextResponse.json(
          { error: 'appName cannot be empty.' },
          { status: 400 }
        );
      }
      data.appName = appName;
    }

    const maybeStr = (key: keyof typeof body) => strOrNull(body[key]);

    const gId = maybeStr('googleClientId');
    if (gId !== undefined) data.googleClientId = gId;
    const gSec = maybeStr('googleClientSecret');
    if (gSec !== undefined) data.googleClientSecret = gSec;

    const tPub = maybeStr('twelveDataApiKeyPublic');
    if (tPub !== undefined) data.twelveDataApiKeyPublic = tPub;
    const tSrv = maybeStr('twelveDataApiKey');
    if (tSrv !== undefined) data.twelveDataApiKey = tSrv;

    const smtpHost = maybeStr('smtpHost');
    if (smtpHost !== undefined) data.smtpHost = smtpHost;
    const smtpPort = maybeStr('smtpPort');
    if (smtpPort !== undefined) data.smtpPort = smtpPort ?? '587';
    if (typeof body.smtpSecure === 'boolean') data.smtpSecure = body.smtpSecure;
    const smtpUser = maybeStr('smtpUser');
    if (smtpUser !== undefined) data.smtpUser = smtpUser;
    const smtpPassword = maybeStr('smtpPassword');
    if (smtpPassword !== undefined) data.smtpPassword = smtpPassword;
    const smtpFrom = maybeStr('smtpFromEmail');
    if (smtpFrom !== undefined) data.smtpFromEmail = smtpFrom;

    if (typeof body.minMarginLevel === 'number' && body.minMarginLevel > 0) {
      data.minMarginLevel = Math.floor(body.minMarginLevel);
    }

    const av = maybeStr('alphaVantageApiKey');
    if (av !== undefined) data.alphaVantageApiKey = av;
    const blobTok = maybeStr('blobReadWriteToken');
    if (blobTok !== undefined) data.blobReadWriteToken = blobTok;
    const npKey = maybeStr('nowpaymentsApiKey');
    if (npKey !== undefined) data.nowpaymentsApiKey = npKey;
    const npIpn = maybeStr('nowpaymentsIpnSecret');
    if (npIpn !== undefined) data.nowpaymentsIpnSecret = npIpn;
    const manualWallet = maybeStr('manualUsdtDepositWalletAddress');
    if (manualWallet !== undefined) {
      data.manualUsdtDepositWalletAddress = manualWallet;
    }

    if (typeof body.openMarket === 'boolean') {
      data.openMarket = body.openMarket;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update.' },
        { status: 400 }
      );
    }

    const existing = await prisma.appSettings.findUnique({
      where: { id: 'default' }
    });

    const settings = existing
      ? await prisma.appSettings.update({
          where: { id: 'default' },
          data
        })
      : await prisma.appSettings.create({
          data: {
            id: 'default',
            appName: 'Trade Nova',
            openMarket: true,
            smtpPort: '587',
            smtpSecure: false,
            minMarginLevel: 100,
            ...((data as unknown) as Omit<
              Prisma.AppSettingsUncheckedCreateInput,
              | 'id'
              | 'appName'
              | 'openMarket'
              | 'smtpPort'
              | 'smtpSecure'
              | 'minMarginLevel'
            >)
          }
        });

    invalidateAppSettingsCache();

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session || !isAllowed(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await request.formData();
    const iconFile = formData.get('icon') as File | null;

    let iconPath: string | undefined;

    const blobOpts = await getBlobPutOptions();

    if (iconFile && iconFile.size > 0) {
      const ext = iconFile.name.split('.').pop() || 'png';
      const filename = `app-icon-${Date.now()}.${ext}`;
      const blob = await put(filename, iconFile, {
        access: 'public',
        addRandomSuffix: true,
        ...blobOpts
      });
      iconPath = blob.url;
    }

    if (!iconPath) {
      const current = await prisma.appSettings.findUnique({
        where: { id: 'default' }
      });
      return NextResponse.json(current);
    }

    const settings = await prisma.appSettings.upsert({
      where: { id: 'default' },
      update: { appIcon: iconPath },
      create: {
        id: 'default',
        appIcon: iconPath
      }
    });

    invalidateAppSettingsCache();

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

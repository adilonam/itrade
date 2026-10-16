import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/lib/prisma/generated/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthSession } from '@/lib/auth';

const ConsentSignSchema = z.object({
  signatureName: z.string().trim().min(2).max(120),
  signatureDataUrl: z
    .string()
    .regex(/^data:image\/(png|jpeg|webp);base64,/, 'Invalid signature image')
    .max(500_000)
});

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || null;
  }
  return request.headers.get('x-real-ip');
}

function dataUrlToBytes(dataUrl: string): {
  content: Prisma.Bytes;
  contentType: string;
} {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error('Invalid data URL');
  }
  const binary = Buffer.from(match[2], 'base64');
  return {
    contentType: match[1],
    content: new Uint8Array(binary) as Prisma.Bytes
  };
}

export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        hasSignedConsent: true,
        consentSignedAt: true,
        consentSignatureName: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      hasSignedConsent: user.hasSignedConsent,
      consentSignedAt: user.consentSignedAt,
      consentSignatureName: user.consentSignatureName
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch consent status' },
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

    const existing = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { hasSignedConsent: true }
    });

    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (existing.hasSignedConsent) {
      return NextResponse.json({
        hasSignedConsent: true,
        message: 'Consent already signed'
      });
    }

    const body = await request.json();
    const validated = ConsentSignSchema.parse(body);
    const { content, contentType } = dataUrlToBytes(validated.signatureDataUrl);

    if (content.length < 100) {
      return NextResponse.json(
        { error: 'Signature image is too small. Please draw your signature.' },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        hasSignedConsent: true,
        consentSignedAt: new Date(),
        consentSignatureName: validated.signatureName,
        consentSignatureContent: content,
        consentSignatureContentType: contentType,
        consentIpAddress: getClientIp(request)
      },
      select: {
        hasSignedConsent: true,
        consentSignedAt: true,
        consentSignatureName: true
      }
    });

    return NextResponse.json({
      hasSignedConsent: updated.hasSignedConsent,
      consentSignedAt: updated.consentSignedAt,
      consentSignatureName: updated.consentSignatureName
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save consent signature' },
      { status: 500 }
    );
  }
}
